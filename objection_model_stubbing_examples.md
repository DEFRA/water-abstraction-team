# Objection Model Stubbing Examples

Below are examples of how Objection Models can be stubbed in a unit test.

## Simple Example

This example is "Simple" as each method is only called once on the `queryStub` making the stubbing process a bit easier. It works as follows:

1. `Sinon.stub(BillRunModel, 'query')` creates a stub for the query method of `BillRunModel`.

2. The stub is then configured to return an object that mimics the query builder chain used in Objection.js (the ORM used in this project).

3. Each method in the chain (`select`, `innerJoinRelated`, `orderBy`, `page`) is stubbed to return 'this', allowing method chaining.

4. The final `page` method is stubbed to resolve with an object containing empty `results` and a `total` of 0, simulating a scenario where no bill runs are found.

### The query in the service to be stubbed

```javascript
async function _fetch (page) {
  return BillRunModel.query()
    .select([
      'billRuns.id',
      'billRuns.batchType',
      'billRuns.billRunNumber',
      'billRuns.createdAt',
      'billRuns.netTotal',
      'billRuns.scheme',
      'billRuns.status',
      'billRuns.summer',
      BillRunModel.raw('(invoice_count + credit_note_count) AS number_of_bills'),
      // NOTE: This is more accurate as it includes zero value bills but it is noticeably less performant
      // BillRunModel.relatedQuery('bills').count().as('numberOfBills'),
      'region.displayName AS region'
    ])
    .innerJoinRelated('region')
    .orderBy([
      { column: 'createdAt', order: 'desc' }
    ])
    .page(page - 1, DatabaseConfig.defaultPageSize)
}
```
### How to stub the query in the unit test

```javascript
  describe('when there are no bill runs', () => {
    beforeEach(async () => {
      // There will usually be bill runs in the database from other tests so we stub the query to simulate no bill runs
      const queryStub = Sinon.stub(BillRunModel, 'query')

      queryStub.returns({
        select: Sinon.stub().returnsThis(),
        innerJoinRelated: Sinon.stub().returnsThis(),
        orderBy: Sinon.stub().returnsThis(),
        page: Sinon.stub().resolves({ results: [], total: 0 })
      })
    })

    it('returns a result with no "results" and 0 for "total"', async () => {
      const result = await FetchBillRunsService.go()

      expect(result.results).to.be.empty()
      expect(result.total).to.equal(0)
    })
  })
````

## More complex example

This example is more complex than the previous as the methods `withGraphFetched` & `modifyGraph` are called multiple times on the `queryStub` making the stubbing process a bit more complicated than the previous. It works as follows:

1. `Sinon.stub(ReviewChargeReferenceModel, 'query')` creates a stub for the query method of `ReviewChargeReferenceModel`.

2. A separate `modifyGraphStub` is created to handle the `modifyGraph` method specifically.

3. The `modifyGraphStub` is configured to return 'this' for most calls, allowing method chaining.

4. The fourth call to `modifyGraphStub` `(onCall(3))` is set to resolve with 'Here is my mock data'. This has to be set as it is the last method in the chain that is called, and needs to to resolve with the mock data. `(onCall(3))` is used as the `modifyGraphStub` gets called 3 times before the final call where it is required to resolve with a value.

5. The main `queryStub` is then configured to return an object that mimics the query builder chain, with methods like `findById`, `select`, `withGraphFetched`, and `modifyGraph` all stubbed.

6. Each of these methods (except `modifyGraph`) is set to return 'this', enabling method chaining.

7. The modifyGraph method uses the separately configured modifyGraphStub.

### The query in the service to be stubbed

```javascript
async function go (chargeReferenceId) {
  const results = await ReviewChargeReferenceModel.query()
    .findById(chargeReferenceId)
    .select('id', 'amendedAuthorisedVolume')
    .withGraphFetched('chargeReference')
    .modifyGraph('chargeReference', (builder) => {
      builder.select([
        'chargeCategoryId'
      ])
    })
    .withGraphFetched('chargeReference.chargeCategory')
    .modifyGraph('chargeReference.chargeCategory', (builder) => {
      builder.select([
        'shortDescription',
        'minVolume',
        'maxVolume'
      ])
    })
    .withGraphFetched('reviewChargeVersion')
    .modifyGraph('reviewChargeVersion', (builder) => {
      builder.select([
        'chargePeriodStartDate',
        'chargePeriodEndDate'
      ])
    })
    .withGraphFetched('reviewChargeElements')
    .modifyGraph('reviewChargeElements', (builder) => {
      builder.select([
        'amendedAllocated'
      ])
    })

  return results
}
```
### How to stub the query in the unit test

```javascript
describe('Can I Stub It (yes we can) service', () => {
  beforeEach(() => {
    const queryStub = Sinon.stub(ReviewChargeReferenceModel, 'query')
    const modifyGraphStub = Sinon.stub()

    modifyGraphStub.returnsThis()
    // The `onCall` numbers work like array indexes so 3 is the fourth call
    modifyGraphStub.onCall(3).resolves('Here is my mock data')

    queryStub.returns({
      findById: Sinon.stub().returnsThis(),
      select: Sinon.stub().returnsThis(),
      withGraphFetched: Sinon.stub().returnsThis(),
      modifyGraph: modifyGraphStub
    })
  })

  afterEach(() => {
    Sinon.restore()
  })

  it('returns my mock data', async () => {
    const result = await CanIStubThisOneService.go()

    expect(result).to.equal('Here is my mock data')
  })
})
````

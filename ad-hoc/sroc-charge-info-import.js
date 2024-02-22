'use strict'

/**
 * Import SROC charging information from CSV
 * Processes the two-part tariff match & allocate stage for the given bill run and billing period
 * @module ChargeInfoService
 */

const fs = require('fs')
const { parse } = require('csv-parse')
const { db } = require('./db/db.js')
const path = require('path')

const ROOT_PATH = process.cwd()
const TIMESTAMP = new Date()

async function go () {
  console.log('Starting. Look for this timestamp if you need to delete and try again.', TIMESTAMP)

  await _processCSV('contacts.csv', _contact)
  console.log('Contacts done!')

  await _processCSV('addresses.csv', _address)
  console.log('Addresses done!')

  await _processCSV('invoice_account_companies.csv', _company)
  console.log('Invoice account companies done!')

  await _processCSV('invoice_account_agent_companies.csv', _company)
  console.log('Invoice account agent companies done!')

  await _processCSV('charge_version_companies.csv', _company)
  console.log('Charge version companies done!')

  await _processCSV('invoice_accounts.csv', _invoiceAccount)
  console.log('Invoice accounts done!')

  await _processCSV('invoice_account_addresses.csv', _invoiceAccountAddress)
  console.log('Invoice account addresses done!')

  await _processCSV('charge_versions.csv', _chargeVersion)
  console.log('Charge versions done!')

  await _processCSV('charge_elements.csv', _chargeElement)
  console.log('Charge elements done!')

  await _processCSV('charge_purposes.csv', _chargePurpose)
  console.log('Charge purposes done!')

  await _deleteSrocToSetupWorkflow()
  console.log('Workflow deleted!')

  console.log('All done!')
}

// HANDLERS  -------------------------------------------------------------------

async function _contact (record) {
  const { externalId, currentHash } = record

  const existingContactId = await _findContact(externalId, currentHash, null)

  if (existingContactId) {
    return
  }

  await _addRecord('crm_v2.contacts', record)
}

async function _address (record) {
  const { externalId, currentHash, uprn } = record

  const existingAddressId = await _findAddress(externalId, currentHash, uprn, null)

  if (existingAddressId) {
    return
  }

  await _addRecord('crm_v2.addresses', record)
}

async function _company (record) {
  const { externalId, currentHash, companyNumber } = record

  const existingCompanyId = await _findCompany(externalId, currentHash, companyNumber, null)

  if (existingCompanyId) {
    return
  }

  await _addRecord('crm_v2.companies', record)
}

async function _invoiceAccount (record) {
  const {
    invoiceAccountNumber,
    companyExternalId, companyCurrentHash, companyNumber, companyId
  } = record

  const existingInvoiceAccountId = await _findInvoiceAccount(invoiceAccountNumber, null)

  if (existingInvoiceAccountId) {
    return
  }

  const matchingCompanyId = await _findCompany(companyExternalId, companyCurrentHash, companyNumber, companyId)

  delete record.companyExternalId
  delete record.companyCurrentHash
  delete record.companyNumber

  record.companyId = matchingCompanyId

  await _addRecord('crm_v2.invoiceAccounts', record)
}

async function _invoiceAccountAddress (record) {
  const {
    invoiceAccountNumber, invoiceAccountId,
    addressExternalId, addressCurrentHash, addressUprn, addressId,
    companyExternalId, companyCurrentHash, companyNumber, agentCompanyId,
    contactExternalId, contactCurrentHash, contactId,
    startDate
  } = record

  const matchingInvoiceAccountId = await _findInvoiceAccount(invoiceAccountNumber, invoiceAccountId)

  const existingRecords = await db('crm_v2.invoiceAccountAddresses')
    .select('invoiceAccountAddressId AS id')
    .where('invoiceAccountId', matchingInvoiceAccountId)
    .where('startDate', startDate)

  if (existingRecords.length > 0) {
    return
  }

  const matchingAddressId = await _findAddress(addressExternalId, addressCurrentHash, addressUprn, addressId)

  const matchingCompanyId = await _findCompany(companyExternalId, companyCurrentHash, companyNumber, agentCompanyId)

  const matchingContactId = await _findContact(contactExternalId, contactCurrentHash, contactId)

  delete record.invoiceAccountNumber
  delete record.addressExternalId
  delete record.addressCurrentHash
  delete record.addressUprn
  delete record.companyExternalId
  delete record.companyCurrentHash
  delete record.companyNumber
  delete record.contactExternalId
  delete record.contactCurrentHash

  record.invoiceAccountId = matchingInvoiceAccountId
  record.addressId = matchingAddressId
  record.agentCompanyId = matchingCompanyId
  record.contactId = matchingContactId

  await _addRecord('crm_v2.invoiceAccountAddresses', record)
}

async function _chargeVersion (record) {
  const {
    invoiceAccountNumber, invoiceAccountId,
    licenceRef,
    companyExternalId, companyCurrentHash, companyNumber, companyId,
    changeReason
  } = record

  const licenceRecord = await db('water.licences').select('licenceId AS id').where('licenceRef', licenceRef)
  if (licenceRecord.length === 0) {
    // We just can't import this one so leave it!
    return
  }

  const matchingInvoiceAccountId = await _findInvoiceAccount(invoiceAccountNumber, invoiceAccountId)
  const matchingCompanyId = await _findCompany(companyExternalId, companyCurrentHash, companyNumber, companyId)

  const changeReasonRecord = await db('water.changeReasons').select('changeReasonId AS id').where('description', changeReason)

  delete record.invoiceAccountNumber
  delete record.companyExternalId
  delete record.companyCurrentHash
  delete record.companyNumber
  delete record.changeReason

  record.licenceId = licenceRecord[0].id
  record.invoiceAccountId = matchingInvoiceAccountId
  record.companyId = matchingCompanyId
  record.changeReasonId = changeReasonRecord[0].id

  await _addRecord('water.chargeVersions', record)
}

async function _chargeElement (record) {
  const { chargeReference, chargeVersionId } = record

  const chargeVersionRecord = await db('water.chargeVersions')
    .select('chargeVersionId AS id')
    .where('chargeVersionId', chargeVersionId)
  if (chargeVersionRecord.length === 0) {
    // The charge version didn't import and if we try the element we'll get an error so leave it!
    return
  }

  const billingChargeCategory = await db('water.billingChargeCategories').select('billingChargeCategoryId AS id').where('reference', chargeReference)

  delete record.chargeReference

  record.billingChargeCategoryId = billingChargeCategory[0].id

  await _addRecord('water.chargeElements', record)
}

async function _chargePurpose (record) {
  const { chargeElementId, mainLegacyId, primaryLegacyId, secondaryLegacyId } = record

  const chargeElementRecord = await db('water.chargeElements')
    .select('chargeElementId AS id')
    .where('chargeElementId', chargeElementId)
  if (chargeElementRecord.length === 0) {
    // The charge element didn't import because the charge version didn't. If we try the charge purpose we'll get an
    // error so leave it!
    return
  }

  // purpose_use_id
  if (mainLegacyId) {
    const main = await db('water.purposesUses').select('purposeUseId AS id').where('legacyId', mainLegacyId)
    record.purposeUseId = main[0].id
  }

  // purpose_primary_id
  if (primaryLegacyId) {
    const primary = await db('water.purposesPrimary').select('purposePrimaryId AS id').where('legacyId', primaryLegacyId)
    record.purposePrimaryId = primary[0].id
  }

  // purpose_secondary_id
  if (secondaryLegacyId) {
    const secondary = await db('water.purposesSecondary').select('purposeSecondaryId AS id').where('legacyId', secondaryLegacyId)
    record.purposeSecondaryId = secondary[0].id
  }

  delete record.mainLegacyId
  delete record.primaryLegacyId
  delete record.secondaryLegacyId

  await _addRecord('water.chargePurposes', record)
}

// FINDERS ---------------------------------------------------------------------
async function _findInvoiceAccount (invoiceAccountNumber, existingId) {
  let results

  if (invoiceAccountNumber) {
    results = await db('crm_v2.invoiceAccounts')
      .select('invoiceAccountId AS id')
      .where('invoiceAccountNumber', invoiceAccountNumber)

    if (results.length > 0) return results[0].id
  }

  return existingId
}

async function _findContact (externalId, currentHash, existingId) {
  let results

  if (externalId) {
    results = await db('crm_v2.contacts').select('contactId AS id').where('externalId', externalId)

    if (results.length > 0) return results[0].id

    results = null
  }

  if (currentHash && !results) {
    results = await db('crm_v2.contacts').select('contactId AS id').where('currentHash', currentHash)

    if (results.length > 0) return results[0].id
  }

  return existingId
}

async function _findAddress (externalId, currentHash, uprn, existingId) {
  let results

  if (externalId) {
    results = await db('crm_v2.addresses').select('addressId AS id').where('externalId', externalId)

    if (results.length > 0) return results[0].id

    results = null
  }

  if (currentHash && !results) {
    results = await db('crm_v2.addresses').select('addressId AS id').where('currentHash', currentHash)

    if (results.length > 0) return results[0].id
  }

  if (uprn && !results) {
    results = await db('crm_v2.addresses').select('addressId AS id').where('uprn', uprn)

    if (results.length > 0) return results[0].id
  }

  return existingId
}

async function _findCompany (externalId, currentHash, companyNumber, existingId) {
  let results

  if (externalId) {
    results = await db('crm_v2.companies').select('companyId AS id').where('externalId', externalId)

    if (results.length > 0) return results[0].id

    results = null
  }

  if (currentHash && !results) {
    results = await db('crm_v2.companies').select('companyId AS id').where('currentHash', currentHash)

    if (results.length > 0) return results[0].id
  }

  if (companyNumber && !results) {
    results = await db('crm_v2.companies').select('companyId AS id').where('companyNumber', companyNumber)

    if (results.length > 0) return results[0].id
  }

  return existingId
}

// PROCESSORS ------------------------------------------------------------------

async function _addRecord (tableName, record) {
  try {
    await db(tableName).insert(record)
  } catch (error) {
    console.error(error.message, record)
    throw error
  }
}

// Credit to https://stackoverflow.com/a/61375162/6117745
function _camelCase (key) {
  return key.toLowerCase().replace(/[-_][a-z0-9]/g, (group) => group.slice(-1).toUpperCase())
}

function _cleaner (record) {
  const timestamps = ['date_created', 'date_updated', 'created_at', 'updated_at']
  const cleanedRecord = {}

  for (const [key, value] of Object.entries(record)) {
    const camelCaseKey = _camelCase(key)

    let cleanedValue = value

    if (timestamps.includes(key)) {
      cleanedValue = TIMESTAMP
    } else if (!value || value === '') {
      cleanedValue = null
    }

    cleanedRecord[camelCaseKey] = cleanedValue
  }

  return cleanedRecord
}

// Credit https://csv.js.org/parse/examples/async_iterator/
async function _processCSV (filename, handler) {
  const fullPath = path.join(ROOT_PATH, 'tmp', filename)

  const parser = fs.createReadStream(fullPath).pipe(parse({ delimiter: ',', columns: true }))
  for await (const record of parser) {
    // Work with each record
    const cleanedRecord = _cleaner(record)
    await handler(cleanedRecord)
  }
}

async function _deleteSrocToSetupWorkflow () {
  return db.raw(`
  DELETE FROM water.charge_version_workflows
  WHERE licence_id IN (SELECT licence_id FROM water.charge_versions cv WHERE cv.scheme = 'sroc')
  AND status = 'to_setup';
  `)
}

(async () => {
  await go()
  process.exit()
})().catch(e => {
  console.error(e.message)
  process.exit(1)
})

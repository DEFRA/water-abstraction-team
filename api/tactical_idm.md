# Water Abstraction Tactical IDM

> <https://github.com/DEFRA/water-abstraction-tactical-idm>

## Create user

Used when an app needs to create a new user record. It appears to support creating users with and without roles. At this time we only have the example for doing it without specifying a role.

### Without role

```bash
curl --location --request POST 'http://localhost:8003/idm/1.0/user' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6InRlc3QiLCJpYXQiOjE1MDMzMTg0NDV9.eWghqjYlPrb8ZjWacYzTCTh1PBtr2BeSv-_ZIwrtmwE' \
--header 'Content-Type: application/json' \
--data-raw '{
    "user_name": "admin-ui1@defra.gov.uk",
    "password": "P@55word",
    "user_data": { "source": "Manual request" },
    "application": "water_dev"
}'
```

```json
{
    "user_name": "admin-ui@defra.gov.uk",
    "password": "P@55word",
    "user_data": { "source": "Manual request" },
    "application": "water_dev"
}
```

## Status

Use to check the service is up and running.

```bash
curl --location --request GET 'http://localhost:8003/status'
```

```json
{
    "version": "2.23.0"
}
```

## User login

Appears to be used when other services need to authenticate user credentials

```bash
curl --location --request POST 'http://localhost:8003/idm/1.0/user/login' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6InRlc3QiLCJpYXQiOjE1MDMzMTg0NDV9.eWghqjYlPrb8ZjWacYzTCTh1PBtr2BeSv-_ZIwrtmwE' \
--header 'Content-Type: application/json' \
--data-raw '{
    "user_name": "acceptance-test.admin@defra.gov.uk",
    "password": "P@55word",
    "application": "water_dev"
}'
```

```json
{
    "user_id": 100008,
    "user_name": "acceptance-test.admin@defra.gov.uk",
    "user_data": {
        "source": "Hail Alan"
    },
    "reset_guid": null,
    "reset_required": null,
    "last_login": "2022-05-11T00:09:14.000Z",
    "bad_logins": "0",
    "application": "water_dev",
    "role": null,
    "date_created": "2022-05-09T15:35:38.322Z",
    "date_updated": "2022-05-11T00:09:13.933Z",
    "external_id": null,
    "reset_guid_date_created": null,
    "enabled": true,
    "err": null
}
```

## User schema

We're not sure what the purpose of this endpoint is. But it appears to return what the schema for a `user` is.

```bash
curl --location --request GET 'http://localhost:8003/idm/1.0/user/schema' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6InRlc3QiLCJpYXQiOjE1MDMzMTg0NDV9.eWghqjYlPrb8ZjWacYzTCTh1PBtr2BeSv-_ZIwrtmwE'
```

```json
{
    "error": null,
    "data": {
        "jsonSchema": {
            "title": "idm.users",
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "alternatives"
                },
                "user_name": {
                    "type": "string",
                    "format": "email"
                },
                "password": {
                    "type": "string"
                },
                "user_data": {
                    "type": "string"
                },
                "reset_guid": {
                    "type": "string",
                    "pattern": "/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i"
                },
                "reset_guid_date_created": {
                    "type": "string"
                },
                "reset_required": {
                    "type": "number"
                },
                "last_login": {
                    "type": "string"
                },
                "bad_logins": {
                    "type": "number"
                },
                "date_created": {
                    "type": "string"
                },
                "date_updated": {
                    "type": "string"
                },
                "application": {
                    "type": "string"
                },
                "role": {
                    "type": "string"
                },
                "external_id": {
                    "type": "string"
                },
                "enabled": {
                    "type": "boolean"
                }
            },
            "required": []
        },
        "config": {
            "primaryKey": "user_id",
            "primaryKeyAuto": true,
            "primaryKeyGuid": false
        }
    }
}
```

# FinanceFlow Azure Functions API

Serverless backend for the cloud integration phase of the FinanceFlow project.

## Functions

| Function | Route | Purpose |
| --- | --- | --- |
| `transactions` | `/api/transactions/{id?}` | Create, list, update, and delete user transactions in Cosmos DB |
| `analytics` | `/api/analytics` | Generate monthly and category analytics from Cosmos DB |
| `extract-receipt` | `/api/extract-receipt` | Upload receipt files to Blob Storage and extract fields with Document Intelligence |

## Local Setup

Install dependencies:

```powershell
cd azure-functions
npm install
```

Create local settings from the example:

```powershell
Copy-Item local.settings.example.json local.settings.json
```

Then fill `local.settings.json` with your Azure resource values.

Run syntax checks:

```powershell
npm test
```

Run locally after Azure Functions Core Tools is installed:

```powershell
npm start
```

## Required Azure App Settings

- `COSMOS_CONNECTION_STRING`
- `COSMOS_DATABASE`
- `COSMOS_CONTAINER`
- `DOCUMENT_INTELLIGENCE_ENDPOINT`
- `DOCUMENT_INTELLIGENCE_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`
- `BLOB_CONTAINER_NAME`

Cosmos DB should use:

- Database: `financedb`
- Container: `transactions`
- Partition key: `/userId`

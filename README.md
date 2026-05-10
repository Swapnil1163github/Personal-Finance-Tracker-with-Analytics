# FinanceFlow — Cloud-Based Personal Finance Tracker
### B.Tech CSE Mini Project | ADCET Ashta | 2025-26
**Guide:** Prof. Shubhangi Patil | **Student:** Swapnil Tanaji Patil (1022031078)

---

## 🗂️ Project Structure

```
finance-tracker/
├── src/                          ← React frontend
│   ├── context/
│   │   ├── AuthContext.js        ← Auth (demo / Azure AD B2C)
│   │   └── DataContext.js        ← Data layer (localStorage / Cosmos DB)
│   ├── pages/
│   │   ├── Dashboard.js          ← KPI cards + charts
│   │   ├── Transactions.js       ← CRUD table with filters
│   │   ├── Analytics.js          ← 6 detailed charts
│   │   └── Receipts.js           ← Upload + AI extraction UI
│   ├── components/
│   │   └── Sidebar.js            ← Navigation
│   └── utils/
│       └── pdfReport.js          ← PDF export
├── azure-functions/              ← Azure Functions backend (Node.js)
│   ├── transactions/index.js     ← CRUD API → Cosmos DB
│   ├── analytics/index.js        ← Analytics aggregation
│   ├── extract-receipt/index.js  ← Document Intelligence + Blob Storage
│   └── get-sas-token/index.js
├── azureConfig.js                ← 🔑 Fill in your Azure keys here
└── README.md
```

---

## ⚡ Quick Start (Run Locally in < 5 minutes)

```bash
# 1. Install dependencies
cd finance-tracker
npm install

# 2. Start development server
npm start
```

Open http://localhost:3000 — the app runs fully with demo data. No Azure account needed yet.

---

## 🔵 Phase 2 — Connect Azure Services (Do this after basic demo works)

### Step 1: Create Azure Resources

In Azure Portal, create these (all free tier / consumption plan):

| Service | Tier | Purpose |
|---------|------|---------|
| Azure Static Web Apps | Free | Host React frontend |
| Azure Functions | Consumption | Backend APIs |
| Azure Cosmos DB | Serverless | Store transactions |
| Azure Blob Storage | LRS | Store receipt images |
| Azure Document Intelligence | Free (500 pages/mo) | Extract receipt data |
| Azure AD B2C | Free (50k MAU) | User authentication |

---

### Step 2: Set Up Cosmos DB

1. Create account → New Database: `financedb`
2. New Container: `transactions` | Partition key: `/userId`
3. Copy the **Primary Connection String** from Keys tab

---

### Step 3: Deploy Azure Functions

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Login
az login

# Create Function App (replace names)
az functionapp create \
  --name finance-tracker-api \
  --resource-group finance-rg \
  --consumption-plan-location centralindia \
  --runtime node \
  --runtime-version 18 \
  --storage-account financetrackerstorage

# Set environment variables
az functionapp config appsettings set \
  --name finance-tracker-api \
  --resource-group finance-rg \
  --settings \
  COSMOS_CONNECTION_STRING="<paste your connection string>" \
  COSMOS_DATABASE="financedb" \
  COSMOS_CONTAINER="transactions" \
  DOCUMENT_INTELLIGENCE_ENDPOINT="https://<your-resource>.cognitiveservices.azure.com/" \
  DOCUMENT_INTELLIGENCE_KEY="<your-key>" \
  AZURE_STORAGE_CONNECTION_STRING="<storage connection string>" \
  BLOB_CONTAINER_NAME="receipts"

# Deploy functions
cd azure-functions
func azure functionapp publish finance-tracker-api
```

---

### Step 4: Deploy Frontend to Azure Static Web Apps

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Build the React app
npm run build

# Deploy
swa deploy ./build \
  --deployment-token <your-deployment-token> \
  --app-name finance-tracker-frontend
```

Or use GitHub Actions (recommended):
1. Push this repo to GitHub
2. In Azure Portal → Static Web Apps → Create → link your GitHub repo
3. Azure auto-generates the GitHub Actions workflow file
4. Every `git push` auto-deploys ✅

---

### Step 5: Update azureConfig.js

```js
// src/azureConfig.js
const azureConfig = {
  auth: {
    clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  // From App Registration
    authority: "https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signupsignin",
    knownAuthorities: ["yourtenant.b2clogin.com"],
    redirectUri: "https://your-static-web-app.azurestaticapps.net",
  },
  apiBaseUrl: "https://finance-tracker-api.azurewebsites.net/api",
  blobStorage: {
    accountName: "financetrackerstorage",
    containerName: "receipts",
    sasToken: "sv=2022-...",  // Generate from Storage > Shared access signature
  },
};
```

### Step 6: Enable Azure Auth in the App

In `src/context/AuthContext.js`, change:
```js
const USE_AZURE_AUTH = true;  // was false
```

Then install MSAL:
```bash
npm install @azure/msal-browser @azure/msal-react
```

---

## 📊 Features Implemented

| Feature | Status | Azure Service |
|---------|--------|---------------|
| Dashboard with KPI cards | ✅ | — |
| Monthly income/expense charts | ✅ | — |
| Category breakdown pie chart | ✅ | — |
| Savings rate trend | ✅ | — |
| Daily spending bar chart | ✅ | — |
| Transaction CRUD (add/edit/delete) | ✅ | Cosmos DB |
| Filter & search transactions | ✅ | — |
| Receipt upload & AI extraction | ✅ (demo) | Document Intelligence |
| Blob Storage for receipts | ✅ | Blob Storage |
| PDF monthly report download | ✅ | — |
| User authentication | ✅ (demo) | Azure AD B2C |
| Auto-save to localStorage | ✅ | — |
| Deploy to Azure Static Web Apps | ✅ | Static Web Apps |
| Serverless backend APIs | ✅ | Azure Functions |

---

## 🧱 Azure Architecture (as per Synopsis)

```
User Browser
     │
     ▼
Azure Static Web Apps (React Frontend)
     │  REST API JSON
     ▼
Azure Functions (Serverless Backend)
  ├── /api/transactions  ──→  Azure Cosmos DB
  ├── /api/analytics     ──→  Azure Cosmos DB
  ├── /api/extract-receipt ─→ Azure Blob Storage
  │                          Azure Document Intelligence
  └── Auth via           ──→ Azure AD B2C (JWT tokens)
```

---

## 🔬 Tech Stack

**Frontend:** React 18, Recharts, jsPDF, CSS-in-JS  
**Backend:** Node.js, Azure Functions (serverless)  
**Database:** Azure Cosmos DB (NoSQL)  
**Storage:** Azure Blob Storage  
**AI/ML:** Azure Document Intelligence (prebuilt-receipt model)  
**Auth:** Azure AD B2C  
**Deploy:** Azure Static Web Apps + GitHub Actions CI/CD  

---

## 📝 For Viva/Demo

**Run locally:** `npm start` → shows full working app with demo data  
**Key talking points:**
- Serverless architecture = no server management, auto-scales
- Cosmos DB = globally distributed NoSQL, low latency
- Azure Document Intelligence = OCR + semantic field extraction (not just raw text)
- Azure AD B2C = enterprise-grade auth, OAuth2/OIDC compliant
- PDF reports use jsPDF client-side (no server needed for export)
- App is "Azure-ready" — just flip `USE_AZURE_AUTH = true` and fill `azureConfig.js`

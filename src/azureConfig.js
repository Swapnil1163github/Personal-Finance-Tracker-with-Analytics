// ============================================================
//  AZURE CONFIGURATION — Fill in your values here
//  After creating your Azure resources, paste the keys below
// ============================================================

const azureConfig = {
  // Azure AD B2C — from Azure Portal > App registrations
  auth: {
    clientId: "YOUR_AZURE_AD_B2C_CLIENT_ID",
    authority: "https://YOUR_TENANT.b2clogin.com/YOUR_TENANT.onmicrosoft.com/B2C_1_signupsignin",
    knownAuthorities: ["YOUR_TENANT.b2clogin.com"],
    redirectUri: window.location.origin,
  },

  // Azure Functions base URL — from your Function App overview
  apiBaseUrl: "https://YOUR_FUNCTION_APP.azurewebsites.net/api",

  // Azure Blob Storage — for receipt uploads
  blobStorage: {
    accountName: "YOUR_STORAGE_ACCOUNT_NAME",
    containerName: "receipts",
    sasToken: "YOUR_SAS_TOKEN",  // Generate from Azure Portal > Storage > Shared access signature
  },
};

export default azureConfig;

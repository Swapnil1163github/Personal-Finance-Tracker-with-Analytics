// ============================================================
//  AZURE CONFIGURATION — Fill in your values here
//  After creating your Azure resources, paste the keys below
// ============================================================

const azureConfig = {
  // Azure AD B2C — from Azure Portal > App registrations
  auth: {
    clientId: "2ebbb428-16f3-4f4e-b51b-d409d3cbd684",
    tenantId: "27302ad8-dd7c-45f6-80f3-e7fdce5a3955",
    authority: "https://login.microsoftonline.com/27302ad8-dd7c-45f6-80f3-e7fdce5a3955",
    scopes: ["api://2ebbb428-16f3-4f4e-b51b-d409d3cbd684/access_as_user"],
    redirectUri: window.location.origin,
  },

  // Azure Functions base URL — from your Function App overview
  apiBaseUrl: "https://financeflow-swapnil-api.azurewebsites.net/api",

  // Azure Blob Storage — for receipt uploads
  blobStorage: {
    accountName: "financeflowswapnil",
    containerName: "receipts",
    sasToken: "YOUR_SAS_TOKEN",  // Generate from Azure Portal > Storage > Shared access signature
  },
};

export default azureConfig;

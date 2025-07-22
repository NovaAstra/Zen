import * as msal from "@azure/msal-browser";

const msalConfig = {

  auth: {
    clientId: "93e341b0-50d7-4762-a3e6-70c9bcfaefdc",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:8081/blank.html",
    postLogoutRedirectUri: "http://localhost:8081/login",
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true
  }
};
const msalInstance = new msal.PublicClientApplication(msalConfig);

async function autoLogin() {
  try {
    // 先等待初始化完成
    await msalInstance.initialize();

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: accounts[0]
      });
      console.log("Silent token acquired:", response.accessToken);
      return response;
    } else {
      const response = await msalInstance.loginRedirect({
        scopes: ["User.Read"],
        state: JSON.stringify({
          sourcePage: window.location.pathname,
          tempId: "abc123"
        })
      });
      msalInstance.setActiveAccount(response.account);
      console.log("Popup login success:", response.accessToken);
      return response;
    }
  } catch (error) {
    console.error("Auto login failed:", error);
    try {
      const response = await msalInstance.loginPopup({
        scopes: ["User.Read"]
      });
      msalInstance.setActiveAccount(response.account);
      console.log("Popup login success:", response.accessToken);
      return response;
    } catch (popupError) {
      console.error("Popup login failed:", popupError);
    }
  }
}

autoLogin();
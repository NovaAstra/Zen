import { type RedirectRequest, PublicClientApplication } from "@azure/msal-browser";

const configuration = {
  auth: {
    clientId: "93e341b0-50d7-4762-a3e6-70c9bcfaefdc",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:8081",
    postLogoutRedirectUri: "http://localhost:8081/login",
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true
  }
};

const request: RedirectRequest = {
  scopes: ["User.Read"],
  state: JSON.stringify({
    sourcePage: window.location.pathname,
  })
}

const msal = new PublicClientApplication(configuration);

async function bootstrap() {
  await msal.initialize();

  const response = await msal.handleRedirectPromise();
  if (response !== null) {
    msal.setActiveAccount(response.account);
  } else {
    msal.loginRedirect(request);
  }
}

bootstrap()

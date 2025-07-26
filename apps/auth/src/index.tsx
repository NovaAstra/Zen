import { autologin } from "@zen-core/msal"

autologin({
  request: { scopes: ['User.Read'] },
  configuration: {
    auth: {
      clientId: '93e341b0-50d7-4762-a3e6-70c9bcfaefdc',
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: "http://localhost:8081",
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    }
  }
})
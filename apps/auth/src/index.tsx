import { InteractionType, MsalClient } from "@zen-core/msal"

const client = new MsalClient({
  interactionType: InteractionType.Popup,
  request: { scopes: ['User.Read'] },
  configuration: {
    auth: {
      clientId: '93e341b0-50d7-4762-a3e6-70c9bcfaefdc',
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: "http://localhost:8081/blank.html",
      postLogoutRedirectUri: 'http://localhost:8081/login',
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    }
  }
})

client.bootstrap().then(() => {
  client.login()
})
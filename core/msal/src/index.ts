import {
  type Configuration,
  type RedirectRequest,
  PublicClientApplication
} from "@azure/msal-browser"
import { Crypt } from '@zen-core/cypt';


export interface ClientOptions {
  request?: RedirectRequest;
  configuration: Configuration;
}

const crypt = await Crypt.create('5jWxDS3HGMhBAk2DSBEIKXlTYCzf2Ph_RGbUQUSQaGg');

export function login(uri: string) {
  const origin = window.location.origin;
  const target = new URL(uri);
  target.searchParams.set("redirect_uri", origin);
  window.location.replace(target.toString());
}

export async function autologin(options: ClientOptions) {
  const { configuration, request } = options
  let msal = await PublicClientApplication.createPublicClientApplication(configuration) as PublicClientApplication

  await msal.initialize();
  const result = await msal.handleRedirectPromise();
  if (result === null) {
    const params = new URLSearchParams(window.location.search);
    request.state = crypt.encrypt({
      redirect_uri: params.get("redirect_uri")
    })
    return await msal.loginRedirect(request)
  }

  const { accessToken, state } = result
  const decrypted = crypt.decrypt(state);
  const params = new URLSearchParams(decrypted);
  const uri = params.get("redirect_uri")
  const target = new URL(uri);
  target.searchParams.set("access_token", accessToken);
  window.location.replace(target.toString());

  return result;
}

export function logout() { }
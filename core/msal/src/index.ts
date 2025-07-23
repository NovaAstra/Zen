import { type Configuration, type IPublicClientApplication, PublicClientApplication } from "@azure/msal-browser"

export interface MsalPluginOptions {

}


export class MsalPlugin {
  public static setup(configuration: Configuration): MsalPlugin {
    return new MsalPlugin(configuration)
  }

  public static msal: PublicClientApplication = null;
  public static initialized: boolean = false;

  public constructor(private readonly configuration: Configuration) {
    this.bootstrap()
  }

  private async bootstrap(): Promise<void> {
    if (!MsalPlugin.msal) {
      const msal = await PublicClientApplication.createPublicClientApplication(this.configuration) as PublicClientApplication
      MsalPlugin.msal = msal;
    }
  }

  public async login() { }

  public async logout() { }
}
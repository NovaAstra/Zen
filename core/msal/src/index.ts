import {
  type Configuration,
  type Logger,
  type RedirectRequest,
  type PopupRequest,
  type EndSessionPopupRequest,
  type EndSessionRequest,
  type AuthenticationResult,
  InteractionType,
  PublicClientApplication
} from "@azure/msal-browser"
import { isArray } from "@zen-core/ezkit"

export { InteractionType }

export interface IMsalClientOptions<T> {
  name?: string;
  version?: string;
  sso?: string;
  state?: T;
  configuration: Configuration;
}

export interface IMsalClientPopupOptions<T> extends IMsalClientOptions<T> {
  request?: PopupRequest;
  logoutRequest?: EndSessionPopupRequest;
  interactionType: InteractionType.Popup;
}

export interface IMsalClientRedirectOptions<T> extends IMsalClientOptions<T> {
  request?: RedirectRequest;
  logoutRequest?: EndSessionRequest;
  interactionType: InteractionType.Redirect;
}

export type MsalClientOptions<T> = IMsalClientPopupOptions<T> | IMsalClientRedirectOptions<T>;

type Listener<T> = (state: T) => void;

export const serialize = (value: unknown, defaultValue?: string) => {
  if (
    typeof value === "object" &&
    value !== null &&
    !isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Reflect.ownKeys(value).length > 0
  ) {
    try {
      return JSON.stringify(value);
    } catch { }
  }
  return defaultValue;
}

export const getErrorMessage = (error: unknown, defaultMessage: string = 'unknown error'): string => {
  if (error instanceof Error) {
    return error.message ?? defaultMessage;
  }
  return defaultMessage;
};

export class MsalClientLogger {
  public constructor(public readonly logger) { }

  public verbose(message: string, correlationId?: string) {
    this.logger.verbose(message, correlationId);
  }
  public info(message: string, correlationId?: string) {
    this.logger.info(message, correlationId);
  }
  public warning(message: string, correlationId?: string) {
    this.logger.warning(message, correlationId);
  }
  public error(message: string, correlationId?: string) {
    this.logger.error(message, correlationId);
  }
}

export class MsalClientContext<T> {
  private state: T;
  private readonly listeners: Set<Listener<T>> = new Set();

  constructor(initialState?: T) {
    this.state = initialState ?? ({} as T);
  }

  public getState(): Readonly<T> {
    return this.state;
  }

  public setState(partial: Partial<T>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  public on(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public dispose() {
    this.listeners.clear();
    this.state = {} as T;
  }
}

export class MsalClient<T = any> {
  public static app: PublicClientApplication = null;
  public static initialized: boolean = false;

  public readonly context: MsalClientContext<T> = null;
  public readonly configuration: Configuration = null;

  public constructor(public readonly options: MsalClientOptions<T>) {
    this.configuration = options.configuration;
    this.context = new MsalClientContext<T>(options.state);
  }

  public async bootstrap(): Promise<void> {
    if (!MsalClient.initialized || !MsalClient.app) {
      try {
        MsalClient.app = await PublicClientApplication.createPublicClientApplication(this.configuration) as PublicClientApplication

        await MsalClient.app.initialize();
        await MsalClient.app.handleRedirectPromise();
        MsalClient.initialized = true
      } catch (e) {
        MsalClient.initialized = false
        MsalClient.app = null
      }
    }
  }

  public async login(): Promise<void | AuthenticationResult> {
    if (!MsalClient.initialized || !MsalClient.app) {
      await this.bootstrap();
    }

    return await this._login()
  }

  public async logout(): Promise<void> {
    if (!MsalClient.initialized || !MsalClient.app) {
      return
    }

    return await this._logout()
  }

  private async _login() {
    const { request, interactionType } = this.options
    const login = interactionType === InteractionType.Popup
      ? MsalClient.app.loginPopup
      : MsalClient.app.loginRedirect
    try {
      await MsalClient.app.loginRedirect(request)
      return
    } catch (e) {
      console.log(e, "ads")
    }
  }

  private async _logout() {
    const { logoutRequest, interactionType } = this.options
    const logout = interactionType === InteractionType.Popup
      ? MsalClient.app.logoutPopup
      : MsalClient.app.logoutRedirect

    try {
      await logout(logoutRequest)
    } catch (e) {

    } finally {
      this.context.dispose()
    }
  }
}

export function login() {
  const origin = window.location.origin;
  window.location.replace(`http://localhost:8081?redirect_uri=${origin}`);
}
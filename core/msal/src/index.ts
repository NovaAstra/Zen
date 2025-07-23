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

export interface IMsalClient {
  readonly configuration: Configuration;

  login(): Promise<void | AuthenticationResult>;
  logout(): Promise<void>;
}

export interface IMsalClientOptions<State = {}> {
  name?: string;
  version?: string;
  sso?: string;
  state?: State;
  configuration: Configuration;
}

export interface IMsalClientPopupOptions extends IMsalClientOptions {
  request: PopupRequest;
  logoutRequest?: EndSessionPopupRequest;
  interactionType: InteractionType.Popup;
}

export interface IMsalClientRedirectOptions extends IMsalClientOptions {
  request?: RedirectRequest;
  logoutRequest?: EndSessionRequest;
  interactionType: InteractionType.Redirect;
}

export type MsalClientOptions = IMsalClientPopupOptions | IMsalClientRedirectOptions;

type Listener<T> = (state: T) => void;

export const isEmpty = (value: unknown): boolean => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) return false;

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return false;
  }

  return Reflect.ownKeys(value).length === 0;
}

export const toString = (value: unknown, defaultValue: string = '') => {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Reflect.ownKeys(value).length > 0
  ) {
    try {
      return JSON.stringify(value);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

export class MsalClientLogger {
  protected logger: Logger;

  public constructor(public readonly options: MsalClientOptions) { }

  public verbose(message: string, correlationId?: string) {
    this._log().verbose(message, correlationId);
  }
  public info(message: string, correlationId?: string) {
    this._log().info(message, correlationId);
  }
  public warning(message: string, correlationId?: string) {
    this._log().warning(message, correlationId);
  }
  public error(message: string, correlationId?: string) {
    this._log().error(message, correlationId);
  }

  private _log(): Logger {
    const { name, version } = this.options
    return this.logger ?? (this.logger = MsalClient.app.getLogger().clone(name, version));
  }
}

export class MsalClientContext<State = {}> {
  private state: State;
  private listeners: Set<Listener<State>> = new Set();

  constructor(initialState?: State) {
    this.state = initialState ?? ({} as State);
  }

  public getState(): State {
    return this.state;
  }

  public setState(partial: Partial<State>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  public subscribe(listener: Listener<State>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export class MsalClient extends MsalClientLogger implements IMsalClient {
  public static async setup(options: MsalClientOptions): Promise<MsalClient> {
    const client = new MsalClient(options);
    await client.bootstrap();
    return client;
  }

  public static app: PublicClientApplication = null;
  public static initialized: boolean = false;

  public context: MsalClientContext = new MsalClientContext();
  public readonly configuration: Configuration = null;

  public constructor(public readonly options: MsalClientOptions) {
    super(options);
    this.configuration = options.configuration;
    this.context = new MsalClientContext(options.state);
  }

  private async bootstrap(): Promise<void> {
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

  public async login<T>(state?: T): Promise<void | AuthenticationResult> {
    if (!MsalClient.initialized || !MsalClient.app) {
      await this.bootstrap();
    }

    return await this._login(state)
  }

  public async logout(): Promise<void> {
    return await this._logout()
  }

  private async _login<T>(state?: T) {
    const { request, interactionType } = this.options
    const login = interactionType === InteractionType.Popup
      ? MsalClient.app.loginPopup
      : MsalClient.app.loginRedirect

    request.state = toString(state)
    return login(request)
  }

  private async _logout() {
    const { logoutRequest, interactionType } = this.options
    const logout = interactionType === InteractionType.Popup
      ? MsalClient.app.logoutPopup
      : MsalClient.app.logoutRedirect
    return logout(logoutRequest)
  }
}
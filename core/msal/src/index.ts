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

  login<State extends object>(state?: State): Promise<void | AuthenticationResult>;
  logout(): Promise<void>;
}

export interface IMsalClientOptions<State> {
  name?: string;
  version?: string;
  sso?: string;
  state?: State;
  configuration: Configuration;
}

export interface IMsalClientPopupOptions<State> extends IMsalClientOptions<State> {
  request: PopupRequest;
  logoutRequest?: EndSessionPopupRequest;
  interactionType: InteractionType.Popup;
}

export interface IMsalClientRedirectOptions<State> extends IMsalClientOptions<State> {
  request?: RedirectRequest;
  logoutRequest?: EndSessionRequest;
  interactionType: InteractionType.Redirect;
}

export type MsalClientOptions<State extends object = object> = IMsalClientPopupOptions<State> | IMsalClientRedirectOptions<State>;

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

export const getErrorMessage = (error: unknown, defaultMessage: string = 'unknown error'): string => {
  if (error instanceof Error) {
    return error.message ?? defaultMessage;
  }
  return defaultMessage;
};

export class MsalClientLogger {
  private readonly logger: Logger;

  public constructor(public readonly options: MsalClientOptions) {
    const { name, version } = options
    this.logger = MsalClient.app.getLogger().clone(name, version);
  }

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

export class MsalClientContext<State extends object = object> {
  private state: State;
  private readonly listeners: Set<Listener<State>> = new Set();

  constructor(initialState?: State) {
    this.state = initialState ?? ({} as State);
  }

  public getState(): Readonly<State> {
    return this.state;
  }

  public setState(partial: Partial<State>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  public on(listener: Listener<State>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public dispose() {
    this.listeners.clear();
    this.state = {} as State;
  }
}

export class MsalClient<State extends object = object> extends MsalClientLogger implements IMsalClient {
  public static app: PublicClientApplication = null;
  public static initialized: boolean = false;

  public static async setup<State extends object = object>(options: MsalClientOptions): Promise<MsalClient> {
    const client = new MsalClient<State>(options);
    await client.bootstrap();
    return client;
  }

  public readonly context: MsalClientContext<State> = null;
  public readonly configuration: Configuration = null;

  public constructor(public readonly options: MsalClientOptions) {
    super(options);
    this.configuration = options.configuration;
    this.context = new MsalClientContext<State>(options.state);
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

        const message = getErrorMessage(e)
        this.error(message)
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
    if (!MsalClient.initialized || !MsalClient.app) {
      throw new Error('Msal Client is not initialized');
    }

    return await this._logout()
  }

  private async _login<T>(state?: T) {
    const { request, interactionType } = this.options
    const login = interactionType === InteractionType.Popup
      ? MsalClient.app.loginPopup
      : MsalClient.app.loginRedirect

    try {
      request.state = toString(state)
      await login(request)
      this.info(`Login successful with interaction type: ${interactionType}`);
      return
    } catch (e) {
      const message = getErrorMessage(e)
      this.error(message)
    }
  }

  private async _logout() {
    const { logoutRequest, interactionType } = this.options
    const logout = interactionType === InteractionType.Popup
      ? MsalClient.app.logoutPopup
      : MsalClient.app.logoutRedirect

    try {
      await logout(logoutRequest)
      this.info(`Logout successful with interaction type: ${interactionType}`);
    } catch (e) {
      const message = getErrorMessage(e)
      this.error(message)
    } finally {
      this.context.dispose()
    }
  }
}
export enum Protocol {
  Database = 'database',
  API = 'api',
  GraphQL = 'graphql',
  WebSocket = 'websocket',
  JSON = 'json'
}

export interface Adapter {
  name: string;
}

export interface APIAdapter extends Adapter {

}

export interface DatabaseAdapter extends Adapter {

}

export interface GraphQLAdapter extends Adapter {

}

export interface JSONAdapter extends Adapter {

}

export interface WebSocketAdapter extends Adapter {

}

export type Datasource =
  | { protocol: Protocol.Database; adapter: DatabaseAdapter }
  | { protocol: Protocol.API; adapter: APIAdapter }
  | { protocol: Protocol.GraphQL; adapter: GraphQLAdapter }
  | { protocol: Protocol.WebSocket; adapter: WebSocketAdapter }
  | { protocol: Protocol.JSON; adapter: JSONAdapter }
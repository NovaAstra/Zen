import { type Datasource } from "./datasource"
import { type Transform } from "./transform"

export interface Position {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Node<Props = {}> extends Position {
  readonly id: string;
  readonly name: string;

  title?: string;

  label?: string;

  datasource?: Datasource;

  transform?: Transform | string;

  props?: Props;

  weight?: number;

  ariaLabel?: string
}
import { type ItemsRange } from "./types";

export interface VirtualStore {
  getRange(): ItemsRange;
}

export interface VirtualOptions {
  count: number;
}

export class Store {

}
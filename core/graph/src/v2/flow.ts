import { type Node } from "./node"

export class Flow<T extends Node> {
  public readonly nodeMap: Map<string, T> = new Map();
}
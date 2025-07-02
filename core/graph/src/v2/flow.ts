import { type Node } from "./node"
import { type Edge } from "./edge"

export class Flow<NodeType extends Node = Node, EdgeType extends Edge = Edge> {
  private readonly nodeMap: Map<string, NodeType> = new Map();
  private readonly edgeMap: Map<string, EdgeType> = new Map();

  public addNodes(payload: NodeType | NodeType[]) {

  }

  public addEdges() { }

  public removeNodes() { }
}
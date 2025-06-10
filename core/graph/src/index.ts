export class Node<P> {
  public constructor(
    public readonly id: string,
    public readonly metadata?: P
  ) { }
}

export interface Edge<T> {
  source: T,
  target: T
}

export class DAG<P, T extends Node<P>> {
  private nodes: Map<string, T> = new Map();
  private edges: Map<string, Set<string>> = new Map();

  public addNodes(...nodes: (string | T)[]) { }

  public addNode(node: string | T) { }

  public addEdges(...edges: Edge<string | T>[]) { }

  public addEdge(source: string | T, target: string | T): void;
  public addEdge(edge: Edge<string | T>): void;
  public addEdge(): void { }

  private createNode(input: string | T): T {
    return typeof input === 'string' ? new Node(input) as T : input
  }

  private createEdge(source: string | T, target: string | T) {
    const sourceId = typeof source === 'string' ? source : source.id;
    const targetId = typeof target === 'string' ? target : target.id;

    this.addNode(source);
    this.addNode(target);

    this.edges.get(sourceId)!.add(targetId);
  }
}
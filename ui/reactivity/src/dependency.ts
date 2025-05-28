import { type Deque } from "./deque";

export interface Node {
  deps: Deque<Link>;
  subs: Deque<Link>;
}

export interface Link {
  dep: Node;
  sub: Node;
}

export class Dependency {
  public link(dep: Node, sub: Node) {

  }
}
import { type Deque } from "@zen-core/linky";

export interface Node {
  deps: Deque<Link>;
  subs: Deque<Link>;
  flags: Flags;
}

export interface Link {
  dep: Node;
  sub: Node;
}

export enum Flags {
  None = 0,
  Mutable = 1 << 0,
  Watching = 1 << 1,
  RecursedCheck = 1 << 2,
  Recursed = 1 << 3,
  Dirty = 1 << 4,
  Pending = 1 << 5,
}

export class Dependency {
  public link(dep: Node, sub: Node) {

  }

  public unlink(link: Link, sub: Node = link.sub) { }
}
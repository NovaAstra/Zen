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
  Mutable = 1 << 0,       // 可变实体（如 signal）
  Watching = 1 << 1,      // 正在监听（如 effect）
  RecursedCheck = 1 << 2, // 开启递归检查依赖链
  Recursed = 1 << 3,      // 当前在递归中
  Dirty = 1 << 4,         // 脏状态（值发生了变化）
  Pending = 1 << 5,       // 可能需要更新（懒更新的中间态）
  Queued = 1 << 6         // 副作用是否已被加入调度队列
}

export class Dependency {
  /**
   * 建立依赖关系，将 sub 订阅到 dep
   * @param dep 依赖节点
   * @param sub 订阅节点
   */
  public link(dep: Node, sub: Node) {
    // 检查是否已存在相同依赖关系
    if (sub.deps.some(link => Object.is(link.dep, dep) && Object.is(link.sub, sub))) return;

    // 创建新的链接
    const link: Link = { dep, sub };

    // 将链接添加到 dep 的订阅列表和 sub 的依赖列表
    dep.subs.push(link);
    sub.deps.push(link);
  }

  /**
   * 解除依赖关系
   * @param link 要解除的链接
   * @param sub 订阅节点（默认为 link.sub）
   * @returns 是否成功解除
   */
  public unlink(link: Link, sub: Node = link.sub) {
    const dep = link.dep;

    // 从 sub.deps 和 dep.subs 中移除 link
    const depIndex = sub.deps.findIndex((l) => l === link);
    const subIndex = dep.subs.findIndex((l) => l === link);

    if (depIndex === -1 || subIndex === -1) return false;

    sub.deps.delete(depIndex);
    dep.subs.delete(subIndex);
    return true;
  }
}
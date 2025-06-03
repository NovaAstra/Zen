
export interface Node {
  deps?: Link;
  depsTail?: Link;
  subs?: Link;
  subsTail?: Link;
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
  Recursed = 1 << 3,      // 已递归
  Dirty = 1 << 4,         // 数据已脏(需要更新)
  Pending = 1 << 5,       // 待处理状态
}

export class Dependency {
  /**
   * 建立依赖关系，将 sub 订阅到 dep
   * @param dep 依赖节点
   * @param sub 订阅节点
   */
  public link(dep: Node, sub: Node) {
    const prevDep: Link = sub.depsTail;
    if (prevDep !== undefined && prevDep.dep === dep) {
      return;
    }

    let nextDep: Link = undefined;
    const recursedCheck = sub.flags & 4 satisfies Flags.RecursedCheck;
    if (recursedCheck) {

    }

    const prevSub = dep.subsTail;
  }

  /**
   * 解除依赖关系
   * @param link 要解除的链接
   * @param sub 订阅节点（默认为 link.sub）
   * @returns 是否成功解除
   */
  public unlink(link: Link, sub: Node = link.sub) {
    const dep: Node = link.dep;
  }
}
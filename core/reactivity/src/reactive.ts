import { Deque } from "@zen-core/linky";
import { type Link, type Node, Flags, Dependency } from "./dependency";

export class Reactive extends Dependency {
  /**
   * 传播脏标记，通知依赖节点
   * @param link 订阅者的链接
   */
  public propagate(link: Link): void {

  }

  /**
   * 开始追踪依赖
   * @param sub 订阅节点
   */
  public track(sub: Node) {
    sub.deps.clear();
    sub.flags = (sub.flags & ~(Flags.Recursed | Flags.Dirty | Flags.Pending)) | Flags.RecursedCheck;
  }

  /**
    * 清理依赖
    * @param sub 订阅节点
    */
  public cleanup(sub: Node): void {
    while (sub.deps.size > 0) {
      const link = sub.deps.at(0)!;
      this.unlink(link, sub);
    }
    sub.flags &= ~Flags.RecursedCheck;
  }


  /**
   * 判断依赖链上是否有变更（递归检测脏状态）
   * @param link 依赖链接
   * @param sub 订阅节点
   * @returns 是否需要更新
   */
  public checkDirty(link: Link, sub: Node) {
    const stack = new Deque<Link>();
    let checkDepth = 0;
  }

  /**
 * 标记节点为脏并浅层传播更新
 * @param node 节点
 */
  public markDirty(node: Node) {
    node.flags |= Flags.Dirty;
    let current = node.subs.at(0);
    while (current) {
      const sub = current.sub;
      const flags = sub.flags;
      if ((flags & (Flags.Pending | Flags.Dirty)) === Flags.Pending) {
        sub.flags |= Flags.Dirty;
        if (flags & Flags.Watching) {

        }
      }
    }
  }
}
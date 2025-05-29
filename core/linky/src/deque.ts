/**
 * 回调函数类型定义
 * @template T 元素类型
 * @template R 返回类型，默认是 boolean
 * @param value 当前元素值
 * @param index 当前元素索引
 * @param deque 当前双端队列实例
 * @param node 当前节点
 * @returns 返回值类型 R
 */
type Callback<T, R = boolean> = (value: T, index: number, deque: Deque<T>, node: Node<T>) => R;

/**
 * 双向链表节点类
 * @template T 节点存储的元素类型
 */
class Node<T> {
  /**
 * 创建一个节点
 * @param value 节点存储的值
 * @param prev 指向前一个节点的引用
 * @param next 指向后一个节点的引用
 */
  public constructor(
    public value: T,
    public prev?: Node<T>,
    public next?: Node<T>
  ) { }
}

/**
 * 根据输入数组创建一组双向链表节点，返回头尾节点
 * @template T 元素类型
 * @param values 要创建节点的元素数组
 * @returns 返回元组 [头节点, 尾节点]
 */
function createNodes<T>(values: T[]): [head: Node<T>, tail: Node<T>] {
  const { head, tail } = values.reduce<{ head: Node<T>; tail: Node<T> }>(
    ({ head, tail }, value, index) => {
      const node = new Node<T>(value);
      if (index === 0) return { head: node, tail: node };

      node.prev = tail;
      tail.next = node;
      return { head, tail: node };
    },
    {} as { head: Node<T>, tail: Node<T> }
  );

  return [head, tail];
}

/**
 * 双端队列类，基于双向链表实现
 * @template T 队列元素类型
 */
export class Deque<T> {
  private head?: Node<T>;

  private tail?: Node<T>;

  private size: number = 0;

  /**
   * 创建双端队列实例
   * @param iterable 可选，初始化的可迭代元素集合
   */
  constructor(iterable: Iterable<T> = []) {
    this.push(...iterable);
  }

  /**
  * 从队尾添加元素
  * @param values 要添加的元素
  * @returns 添加后队列的长度
  */
  public push(...values: T[]): number {
    const [head, tail] = createNodes(values);

    if (this.tail) {
      this.tail.next = head;
      head.prev = this.tail;
    } else {
      this.head = head;
    }

    this.tail = tail;
    this.size += values.length;
    return this.size;
  }

  /**
  * 从队尾移除元素并返回
  * @returns 被移除的元素，若队列为空则返回 undefined
  */
  public pop(): T | undefined {
    if (!this.tail) return undefined;

    const tail = this.tail;
    this.tail = tail.prev;

    if (this.tail) {
      this.tail.next = undefined;
    } else {
      this.head = undefined;
    }

    this.size--;
    return tail.value;
  }

  /**
 * 从队首移除元素并返回
 * @returns 被移除的元素，若队列为空则返回 undefined
 */
  public shift(): T | undefined {
    if (!this.head) return undefined;

    const head = this.head;
    this.head = head.next;

    if (this.head) {
      this.head.prev = undefined;
    } else {
      this.tail = undefined;
    }

    this.size--;
    return head.value;
  }

  public toReversed() {

  }

  /**
  * 反转当前队列的元素顺序，原地修改
  * @returns 返回当前队列实例
  */
  public reverse() {
    let node = this.head;

    while (node) {
      const { prev, next } = node;
      [node.prev, node.next] = [next, prev];
      node = next;
    }
    [this.head, this.tail] = [this.tail, this.head];

    return this;
  }


  /**
   * 查找满足条件的元素索引
   * @param callback 回调函数，用于测试元素
   * @returns 找到的第一个满足条件的元素索引，找不到返回 -1
   */
  public findIndex(callback: Callback<T>): number {
    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node)) return index;
      node = node.next;
      index++;
    }
    return -1;
  }

  /**
  * 查找满足条件的元素值
  * @param callback 回调函数，用于测试元素
  * @returns 找到的第一个满足条件的元素，找不到返回 undefined
  */
  public find(callback: Callback<T>): T | undefined {
    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node)) return node.value;
      node = node.next;
      index++;
    }
    return undefined;
  }

  /**
  * 检查所有元素是否都满足条件
  * @param callback 回调函数，用于测试元素
  * @returns 如果所有元素都满足条件，返回 true；否则返回 false
  */
  public every(callback: Callback<T>): boolean {
    let index = 0;
    let node = this.head;

    while (node) {
      if (!callback(node.value, index, this, node)) return false;
      node = node.next;
      index++;
    }
    return false;
  }

  /**
   * 检查是否存在满足条件的元素
   * @param callback 回调函数，用于测试元素
   * @returns 存在满足条件的元素返回 true，否则 false
   */
  public some(callback: Callback<T>): boolean {
    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node)) return true;
      node = node.next;
      index++;
    }
    return false;
  }

  /**
  * 过滤出满足条件的元素，返回新的双端队列
  * @param callback 回调函数，用于测试元素
  * @returns 包含所有满足条件元素的新 Deque 实例
  */
  public filter(callback: Callback<T>): Deque<T> {
    const deque = new Deque<T>();

    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node))
        deque.push(node.value);
      node = node.next;
      index++;
    }

    return deque;
  }

  /**
   * 遍历所有元素，执行回调函数
   * @param callback 回调函数，处理元素，无返回值
   */
  public forEach(callback: Callback<T, void>): void {
    let index = 0;
    let node = this.head;

    while (node) {
      callback(node.value, index, this, node);
      node = node.next;
      index++;
    }
  }

  /**
  * 映射所有元素，返回映射后的新双端队列
  * @template N 映射后元素类型
  * @param callback 映射函数，返回新元素
  * @returns 新的 Deque 实例，包含映射后的元素
  */
  public map<N>(callback: Callback<T, N>): Deque<N> {
    const deque = new Deque<N>();

    let index = 0;
    let node = this.head;

    while (node) {
      deque.push(callback(node.value, index, this, node));
      node = node.next;
      index++;
    }

    return deque;
  }

  /**
  * 清空队列，重置状态
  */
  public clear() {
    this.head = this.tail = undefined;
    this.size = 0;
  }

  /**
  * 默认迭代器，支持 for...of 遍历
  * @returns 迭代器，依次返回队列元素
  */
  public [Symbol.iterator](): Iterator<T> {
    return this.values();
  }

  /**
  * 生成器函数，依次返回队列元素
  * @private
  */
  private *values(): Iterator<T> {
    let node = this.head;

    while (node) {
      yield node.value;

      node = node.next;
    }
  }
}
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

  public size: number = 0;

  /**
   * 创建双端队列实例
   * @param iterable 可选，初始化的可迭代元素集合
   */
  constructor(iterable: Iterable<T> = []) {
    this.push(...iterable);
  }

  public get(index: number) {
    const node = this.getNode(index);
    if (node) return node.value;
    return;
  }

  public set(index: number, value: T) {
    if (index == this.size) {
      this.push(value);
      return true;
    }

    const node = this.getNode(index);
    if (!node) return false;
    node.value = value;
    return true;
  }

  public has() { }

  public delete() { }

  public at(index: number): T | undefined {
    if (index < 0) index += this.size;
    if (index < 0 || index >= this.size) return undefined;

    let node = this.head;
    let i = 0;
    while (node && i < index) {
      node = node.next;
      i++;
    }

    return node?.value;
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

  /**
   * 从队首添加元素
   * @param values 要添加的元素
   * @returns 添加后队列的长度
   */
  public unshift(...values: T[]): number {
    const [head, tail] = createNodes(values);

    if (this.head) {
      this.head.prev = tail;
      tail.next = this.head;
    } else {
      this.tail = tail;
    }

    this.head = head;
    this.size += values.length;
    return this.size;
  }

  /**
   * 拼接两个 Deque 实例，返回新实例
   * @param other 要拼接的 Deque 或可迭代对象
   * @returns 拼接后的新 Deque 实例
   */
  public concat(other: Iterable<T>): Deque<T> {
    const deque = new Deque<T>(this);
    for (const item of other) {
      deque.push(item);
    }
    return deque;
  }

  /**
     * 提取部分队列，返回新 Deque
     * @param start 起始索引（包含）
     * @param end 结束索引（不包含）
     * @returns 新的 Deque 实例
     */
  public slice(start: number = 0, end: number = this.size): Deque<T> {
    const deque = new Deque<T>();
    if (start < 0) start += this.size;
    if (end < 0) end += this.size;

    let index = 0;
    let node = this.head;

    while (node && index < end) {
      if (index >= start) {
        deque.push(node.value);
      }
      node = node.next;
      index++;
    }

    return deque;
  }

  public splice() { }

  public reduce() { }

  public reduceRight() { }

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

  public keys() { }

  /**
    * 查找元素是否存在
    * @param value 要查找的值
    * @returns 是否存在
    */
  public includes(value: T): boolean {
    for (const item of this) {
      if (Object.is(item, value)) return true;
    }
    return false;
  }


  /**
   * 查找元素的索引
   * @param value 要查找的值
   * @returns 索引值，未找到返回 -1
   */
  public indexOf(value: T): number {
    let index = 0;
    for (const item of this) {
      if (Object.is(item, value)) return index;
      index++;
    }
    return -1;
  }

  /**
  * 将 Deque 扁平化一层（仅限嵌套的 Deque 或数组）
  * @returns 扁平化后的 Deque
  */
  public flat(): Deque<T> {
    const deque = new Deque<T>();
    for (const value of this) {
      if (Array.isArray(value) || value instanceof Deque) {
        for (const v of value) deque.push(v);
      } else {
        deque.push(value);
      }
    }
    return deque;
  }


  /**
   * 映射并扁平化
   * @param callback 映射函数
   * @returns 扁平化后的 Deque
   */
  public flatMap<N>(callback: Callback<T, N[] | Deque<N>>): Deque<N> {
    const deque = new Deque<N>();
    let index = 0;
    let node = this.head;

    while (node) {
      const mapped = callback(node.value, index, this, node);
      for (const v of mapped) deque.push(v);
      node = node.next;
      index++;
    }

    return deque;
  }

  /**
  * 查找最后一个满足条件的元素
  * @param callback 条件回调
  * @returns 找到的元素或 undefined
  */
  public findLast(callback: Callback<T>): T | undefined {
    let index = this.size - 1;
    let node = this.tail;

    while (node) {
      if (callback(node.value, index, this, node)) return node.value;
      node = node.prev;
      index--;
    }

    return undefined;
  }

  /**
 * 查找最后一个满足条件的元素索引
 * @param callback 条件回调
 * @returns 索引或 -1
 */
  public findLastIndex(callback: Callback<T>): number {
    let index = this.size - 1;
    let node = this.tail;

    while (node) {
      if (callback(node.value, index, this, node)) return index;
      node = node.prev;
      index--;
    }

    return -1;
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
    return true;
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

  public sort() {

  }

  /**
   * 以字符串形式连接所有元素
   * @param separator 分隔符，默认为逗号
   * @returns 拼接后的字符串
   */
  public join(separator: string = ","): string {
    return this.toArray().join(separator);
  }

  /**
 * 使用映射后的值替换指定索引位置的元素
 * @param index 替换的位置
 * @param value 新的值
 * @returns 新的 Deque 实例
 */
  public with(index: number, value: T) { }

  public toArray(): T[] {
    const result: T[] = [];
    for (const value of this) {
      result.push(value);
    }
    return result;
  }

  /**
     * 返回 Deque 的字符串表示形式
     * @returns 字符串形式
     */
  public toString(): string {
    return this.join();
  }

  /**
  * 返回值组成的新数组，按升序排序
  * @param compareFn 可选，自定义排序函数
  * @returns 新的 Deque 实例
  */
  public toSorted(compareFn?: (a: T, b: T) => number): Deque<T> {
    return new Deque<T>([...this.toArray()].sort(compareFn));
  }

  /**
    * 删除指定位置的若干元素，并用新元素替换，返回新 Deque
    * @param start 开始索引
    * @param deleteCount 删除数量
    * @param items 新插入的元素
    * @returns 修改后的新 Deque 实例
    */
  public toSpliced(start: number, deleteCount: number, ...items: T[]): Deque<T> {
    const deque = new Deque<T>();
    let i = 0;

    for (const item of this) {
      if (i === start) {
        for (const newItem of items) deque.push(newItem);
      }
      if (i < start || i >= start + deleteCount) {
        deque.push(item);
      }
      i++;
    }

    return deque;
  }

  public toReversed() {
    const deque = new Deque<T>();
    let node = this.tail;

    while (node) {
      deque.push(node.value);
      node = node.prev;
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
 * 获取指定位置的节点（内部使用）
 * @param index 索引位置
 * @returns 对应节点或 undefined
 */
  private getNode(index: number): Node<T> | undefined {
    if (index < 0) index += this.size;
    if (index < 0 || index >= this.size) return undefined;

    let node = this.head;
    let i = 0;
    while (node && i < index) {
      node = node.next;
      i++;
    }
    return node;
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
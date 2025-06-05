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
type Callback<T, R = boolean> = (
  value: T,
  index: number,
  deque: Deque<T>,
  node: Node<T>
) => R;

/**
 * 双向链表节点类
 * @template T 节点存储的元素类型
 */
class Node<T> {
  /**
   * 创建一个节点
   * @param value 节点存储的值
   * @param prev 前一个节点引用
   * @param next 后一个节点引用
   */
  constructor(
    public value: T,
    public prev: Node<T> | undefined = undefined,
    public next: Node<T> | undefined = undefined
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
    {} as { head: Node<T>; tail: Node<T> }
  );

  return [head, tail];
}

/**
 * 双端队列类，基于双向链表实现
 * @template T 队列元素类型
 */
export class Deque<T> {
  public head?: Node<T>; // 队列头部节点
  public tail?: Node<T>; // 队列尾部节点
  public size: number = 0; // 队列当前大小

  /**
   * 创建双端队列实例
   * @param iterable 可选，初始化的可迭代元素集合
   */
  public constructor(iterable: Iterable<T> = []) {
    this.push(...iterable);
  }

  /**
   * 获取指定索引位置的元素值
   * @param index 要获取的索引位置
   * @returns 元素值或undefined(如果索引无效)
   */
  public get(index: number): T | undefined {
    return this.getNode(index)?.value;
  }

  /**
   * 设置指定索引位置的元素值
   * @param index 要设置的索引位置
   * @param value 要设置的新值
   * @returns 是否设置成功
   */
  public set(index: number, value: T): boolean {
    if (index === this.size) {
      this.push(value);
      return true;
    }

    const node = this.getNode(index);
    if (!node) return false;
    node.value = value;
    return true;
  }

  /**
   * 检查队列中是否包含指定值
   * @param value 要查找的值
   * @returns 是否包含
   */
  public has(value: T): boolean {
    return this.includes(value);
  }

  /**
   * 删除指定位置的元素
   * @param index 要删除的元素索引
   * @returns 是否成功删除
   */
  public delete(index: number): boolean {
    const node = this.getNode(index);
    if (!node) return false;

    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;

    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;

    this.size--;
    return true;
  }

  /**
   * 获取指定索引位置的元素(支持负数索引)
   * @param index 索引位置(负数表示从末尾开始计算)
   * @returns 元素值或undefined(如果索引无效)
   */
  public at(index: number): T | undefined {
    if (index < 0) index += this.size;
    if (index < 0 || index >= this.size) return undefined;
    return this.get(index);
  }

  /**
   * 删除第一个匹配指定条件的元素
   * @param value 要删除的值
   * @param predicate 自定义匹配函数(可选)
   * @returns 是否删除成功
   */
  public remove(
    value: T,
    predicate: Callback<T> = (value, _, __, node) =>
      Object.is(value, node.value)
  ): boolean {
    let node = this.head;
    let index = 0;
    while (node) {
      if (predicate(value, index, this, node)) {
        return this.delete(index);
      }
      node = node.next;
      index++;
    }
    return false;
  }

  /**
   * 删除所有匹配指定条件的元素
   * @param value 要删除的值
   * @param predicate 自定义匹配函数(可选)
   * @returns 删除的元素数量
   */
  public removeAll(
    value: T,
    predicate: Callback<T> = (val, _, __, node) => Object.is(val, node.value)
  ): number {
    let count = 0;
    let node = this.head;
    let index = 0;

    while (node) {
      const next = node.next;
      if (predicate(value, index, this, node)) {
        this.delete(index);
        count++;
        // 删除后索引不需要增加，因为后面的元素会前移
      } else {
        index++;
      }
      node = next;
    }

    return count;
  }

  /**
   * 从队尾添加元素
   * @param values 要添加的元素
   * @returns 添加后队列的长度
   */
  public push(...values: T[]): number {
    if (values.length === 0) return this.size;

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

    if (this.tail) this.tail.next = undefined;
    else this.head = undefined;

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

    if (this.head) this.head.prev = undefined;
    else this.tail = undefined;

    this.size--;
    return head.value;
  }

  /**
   * 从队首添加元素
   * @param values 要添加的元素
   * @returns 添加后队列的长度
   */
  public unshift(...values: T[]): number {
    if (values.length === 0) return this.size;
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
   * 拼接可迭代对象
   * @param iterable 可迭代对象
   * @returns 新 Deque 实例
   */
  public concat(iterable: Iterable<T>): Deque<T> {
    const deque = new Deque<T>(this);
    deque.push(...iterable);
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
      if (index >= start) deque.push(node.value);
      node = node.next;
      index++;
    }

    return deque;
  }

  /**
   * 删除并插入元素，返回被删除的元素
   * @param start 开始索引
   * @param deleteCount 删除数量
   * @param items 新插入元素
   * @returns 被删除的元素组成的新 Deque
   */
  public splice(start: number, deleteCount: number, ...items: T[]): Deque<T> {
    if (start < 0) start += this.size;
    if (start < 0 || start > this.size) return new Deque<T>();

    const deleted = new Deque<T>();
    let node = this.getNode(start);
    for (let i = 0; i < deleteCount && node; i++) {
      deleted.push(node.value);
      const next = node.next;
      this.delete(start);
      node = next;
    }

    if (items.length) {
      const nodes = items.map((value) => new Node<T>(value));
      for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].next = nodes[i + 1];
        nodes[i + 1].prev = nodes[i];
      }

      const nextNode = this.getNode(start);
      const prevNode = nextNode?.prev ?? this.tail;

      if (prevNode) {
        prevNode.next = nodes[0];
        nodes[0].prev = prevNode;
      } else {
        this.head = nodes[0];
      }

      if (nextNode) {
        nextNode.prev = nodes[nodes.length - 1];
        nodes[nodes.length - 1].next = nextNode;
      } else {
        this.tail = nodes[nodes.length - 1];
      }

      this.size += items.length;
    }

    return deleted;
  }

  /**
   * 聚合计算
   * @param callback 聚合函数
   * @param initial 初始值
   * @returns 聚合结果
   */
  public reduce<U>(
    callback: (acc: U, value: T, index: number, deque: Deque<T>) => U,
    initial: U
  ): U {
    let acc = initial;
    let index = 0;
    let node = this.head;
    while (node) {
      acc = callback(acc, node.value, index, this);
      node = node.next;
      index++;
    }
    return acc;
  }

  /**
   * 从右向左聚合计算值
   * @param callback 回调函数
   * @param initial 初始值
   * @returns 聚合结果
   */
  public reduceRight<U>(
    callback: (acc: U, value: T, index: number, deque: Deque<T>) => U,
    initial: U
  ): U {
    let acc = initial;
    let index = this.size - 1;
    let node = this.tail;
    while (node) {
      acc = callback(acc, node.value, index, this);
      node = node.prev;
      index--;
    }
    return acc;
  }

  /**
   * 反转队列（原地操作）
   * @returns 当前 Deque 实例
   */
  public reverse() {
    let node = this.head;

    while (node) {
      [node.prev, node.next] = [node.next, node.prev];
      node = node.prev;
    }
    [this.head, this.tail] = [this.tail, this.head];

    return this;
  }

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
   * 扁平化嵌套 Deque 或数组
   * @returns 新 Deque 实例
   */
  public flat(depth: number = 1): Deque<T> {
    const deque = new Deque<T>();

    const flatten = (value: T, level: number) => {
      if (level > 0 && (Array.isArray(value) || value instanceof Deque)) {
        for (const item of value) {
          flatten(item, level - 1);
        }
      } else {
        deque.push(value);
      }
    };

    for (const item of this) {
      flatten(item, depth);
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
      deque.push(...mapped);
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
      if (callback(node.value, index, this, node)) deque.push(node.value);
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
   * 排序队列（原地操作）
   * @param compareFn 比较函数
   * @returns 当前 Deque 实例
   */
  public sort(compareFn?: (a: T, b: T) => number): this {
    const sorted = this.toArray().sort(compareFn);
    this.clear();
    this.push(...sorted);
    return this;
  }

  /**
   * 连接元素为字符串
   * @param separator 分隔符
   * @returns 拼接字符串
   */
  public join(separator: string = ","): string {
    let result = "";
    let node = this.head;
    while (node) {
      result += (node === this.head ? "" : separator) + String(node.value);
      node = node.next;
    }
    return result;
  }

  /**
   * 使用映射后的值替换指定索引位置的元素
   * @param index 替换的位置
   * @param value 新的值
   * @returns 新的 Deque 实例
   */
  public with(index: number, value: T): Deque<T> {
    const deque = new Deque<T>(this);
    deque.set(index, value);
    return deque;
  }

  /**
   * 转换为数组
   * @returns 元素数组
   */
  public toArray(): T[] {
    const result: T[] = [];
    let node = this.head;
    while (node) {
      result.push(node.value);
      node = node.next;
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
   * 返回删除并插入后的新队列
   * @param start 开始索引
   * @param deleteCount 删除数量
   * @param items 新插入元素
   * @returns 新 Deque 实例
   */
  public toSpliced(
    start: number,
    deleteCount: number,
    ...items: T[]
  ): Deque<T> {
    const deque = new Deque<T>();
    let i = 0;
    let node = this.head;

    while (node) {
      if (i === start) {
        deque.push(...items);
      }
      if (i < start || i >= start + deleteCount) {
        deque.push(node.value);
      }
      node = node.next;
      i++;
    }

    if (i <= start) deque.push(...items);
    return deque;
  }

  /**
   * 返回反转后的新队列
   * @returns 新 Deque 实例
   */
  public toReversed() {
    const deque = new Deque<T>();
    let node = this.tail;

    while (node) {
      deque.push(node.value);
      node = node.prev;
    }

    return deque;
  }

  public clone(): Deque<T> {
    const deque = new Deque<T>(this);
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
  public *values(): Iterator<T> {
    let node = this.head;
    while (node) {
      yield node.value;
      node = node.next;
    }
  }

  /**
   * 返回索引迭代器
   */
  public *keys(): IterableIterator<number> {
    for (let i = 0; i < this.size; i++) {
      yield i;
    }
  }

  /**
   * 获取指定索引位置的节点
   * @param index 索引位置(支持负数)
   * @returns 对应节点或undefined
   */
  private getNode(index: number): Node<T> | undefined {
    if (index < 0) index += this.size;
    if (index < 0 || index >= this.size) return undefined;

    // 根据位置选择从头或从尾开始遍历
    if (index < this.size / 2) {
      // 前半部分从头开始
      let node = this.head;
      for (let i = 0; i < index && node; i++) {
        node = node.next;
      }
      return node;
    } else {
      // 后半部分从尾开始
      let node = this.tail;
      for (let i = this.size - 1; i > index && node; i--) {
        node = node.prev;
      }
      return node;
    }
  }
}

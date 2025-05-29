import { beforeEach, describe, expect, it } from "vitest"
import { Deque } from ".";

describe("双端队列", () => {
  let deque: Deque<number>;

  beforeEach(() => {
    deque = new Deque<number>();
  });

  it("初始化时大小应为0", () => {
    expect(deque.size).toBe(0);
    expect(deque.head).toBeUndefined();
    expect(deque.tail).toBeUndefined();
  });

  it('从可迭代对象初始化', () => {
    deque = new Deque([1, 2, 3]);
    expect(deque.size).toBe(3);
    expect(deque.toArray()).toEqual([1, 2, 3]);
  });

  it("队尾添加元素", () => {
    deque.push(1, 2, 3);
    expect(deque.size).toBe(3);
    expect(deque.toArray()).toEqual([1, 2, 3]);
  });

  it("队尾移除元素", () => {
    deque.push(1, 2, 3);
    expect(deque.pop()).toBe(3);
    expect(deque.size).toBe(2);
    expect(deque.toArray()).toEqual([1, 2]);
    expect(deque.pop()).toBe(2);
    expect(deque.pop()).toBe(1);
    expect(deque.pop()).toBeUndefined();
    expect(deque.size).toBe(0);
  });

  it('队首添加元素', () => {
    deque.unshift(1, 2, 3);
    expect(deque.size).toBe(3);
    expect(deque.toArray()).toEqual([1, 2, 3]);
  });

  it('队首移除元素', () => {
    deque.push(1, 2, 3);
    expect(deque.shift()).toBe(1);
    expect(deque.size).toBe(2);
    expect(deque.toArray()).toEqual([2, 3]);
    expect(deque.shift()).toBe(2);
    expect(deque.shift()).toBe(3);
    expect(deque.shift()).toBeUndefined();
    expect(deque.size).toBe(0);
  });

  it('反转队列', () => {
    deque.push(1, 2, 3);
    deque.reverse();
    expect(deque.toArray()).toEqual([3, 2, 1]);
    // 测试单个元素
    deque = new Deque([1]);
    deque.reverse();
    expect(deque.toArray()).toEqual([1]);
    // 测试空队列
    deque = new Deque();
    deque.reverse();
    expect(deque.toArray()).toEqual([]);
  });

  it('获取和设置元素', () => {
    deque.push(1, 2, 3);
    expect(deque.get(1)).toBe(2);
    expect(deque.set(1, 5)).toBe(true);
    expect(deque.toArray()).toEqual([1, 5, 3]);
    expect(deque.set(3, 4)).toBe(true); // 追加
    expect(deque.toArray()).toEqual([1, 5, 3, 4]);
    expect(deque.set(10, 10)).toBe(false); // 无效索引
  });

  it('支持正负索引访问', () => {
    deque.push(1, 2, 3);
    expect(deque.at(0)).toBe(1);
    expect(deque.at(2)).toBe(3);
    expect(deque.at(-1)).toBe(3);
    expect(deque.at(-3)).toBe(1);
    expect(deque.at(-4)).toBeUndefined();
    expect(deque.at(3)).toBeUndefined();
  });

  it('删除指定索引元素', () => {
    deque.push(1, 2, 3);
    expect(deque.delete(1)).toBe(true);
    expect(deque.toArray()).toEqual([1, 3]);
    expect(deque.delete(0)).toBe(true);
    expect(deque.toArray()).toEqual([3]);
    expect(deque.delete(0)).toBe(true);
    expect(deque.toArray()).toEqual([]);
    expect(deque.delete(0)).toBe(false);
  });

  it('移除指定值元素', () => {
    deque.push(1, 2, 3, 2);
    expect(deque.remove(2)).toBe(true);
    expect(deque.toArray()).toEqual([1, 3, 2]);
    expect(deque.remove(4)).toBe(false);
  });

  it('移除所有匹配元素', () => {
    deque.push(1, 2, 2, 3, 2);
    expect(deque.removeAll(2)).toBe(3);
    expect(deque.toArray()).toEqual([1, 3]);
  });

  it('拼接可迭代对象', () => {
    deque.push(1, 2);
    const newDeque = deque.concat([3, 4]);
    expect(newDeque.toArray()).toEqual([1, 2, 3, 4]);
    expect(deque.toArray()).toEqual([1, 2]); // 原队列不变
  });

  it('切片操作', () => {
    deque.push(1, 2, 3, 4);
    expect(deque.slice(1, 3).toArray()).toEqual([2, 3]);
    expect(deque.slice(-2).toArray()).toEqual([3, 4]);
    expect(deque.slice(0, 0).toArray()).toEqual([]);
  });

  it('拼接和删除元素', () => {
    deque.push(1, 2, 3, 4);
    const deleted = deque.splice(1, 2, 5, 6);
    expect(deque.toArray()).toEqual([1, 5, 6, 4]);
    expect(deleted.toArray()).toEqual([2, 3]);
  });

  it('映射元素', () => {
    deque.push(1, 2, 3);
    const mapped = deque.map((x) => x * 2);
    expect(mapped.toArray()).toEqual([2, 4, 6]);
  });

  it('过滤元素', () => {
    deque.push(1, 2, 3, 4);
    const filtered = deque.filter((x) => x % 2 === 0);
    expect(filtered.toArray()).toEqual([2, 4]);
  });

  it('替换指定索引元素', () => {
    deque.push(1, 2, 3);
    const newDeque = deque.with(1, 5);
    expect(newDeque.toArray()).toEqual([1, 5, 3]);
    expect(deque.toArray()).toEqual([1, 2, 3]); // 原队列不变
  });

  it('替换头元素', () => {
    deque.push(1, 2, 3);
    const newDeque = deque.with(0, 4);
    expect(newDeque.toArray()).toEqual([4, 2, 3]);
  });

  it('替换尾元素', () => {
    deque.push(1, 2, 3);
    const newDeque = deque.with(2, 6);
    expect(newDeque.toArray()).toEqual([1, 2, 6]);
  });

  it('替换负索引元素', () => {
    deque.push(1, 2, 3);
    const newDeque = deque.with(-1, 7);
    expect(newDeque.toArray()).toEqual([1, 2, 7]);
  });

  it('无效索引不抛异常，返回新队列', () => {
    deque.push(1, 2, 3);
    const newDeque = deque.with(3, 8);
    expect(newDeque.toArray()).toEqual([1, 2, 3, 8]); // 追加到末尾
    expect(deque.toArray()).toEqual([1, 2, 3]); // 原队列不变
  });

  it('负索引超出范围，返回新队列', () => {
    deque.push(1, 2, 3);
    const newDeque = deque.with(-5, 9);
    expect(newDeque.toArray()).toEqual([1, 2, 3]); // 无效索引，原样返回
  });

  it('空队列替换索引0', () => {
    const newDeque = deque.with(0, 1);
    expect(newDeque.toArray()).toEqual([1]);
    expect(deque.toArray()).toEqual([]);
  });

  it('空队列返回空字符串', () => {
    expect(deque.join()).toBe('');
  });

  it('单元素队列无分隔符', () => {
    deque.push(1);
    expect(deque.join()).toBe('1');
  });

  it('多元素队列使用默认逗号分隔', () => {
    deque.push(1, 2, 3);
    expect(deque.join()).toBe('1,2,3');
  });

  it('多元素队列使用自定义分隔符', () => {
    deque.push(1, 2, 3);
    expect(deque.join('-')).toBe('1-2-3');
  });

  it('字符串元素正确拼接', () => {
    expect(new Deque<string>(['a', 'b', 'c']).join('|')).toBe('a|b|c');
  });

  it('混合类型元素转换为字符串', () => {
    expect(new Deque<number | string | boolean>([1, 'two', true]).join(' ')).toBe('1 two true');
  });

  it('空分隔符直接拼接', () => {
    deque.push(1, 2, 3);
    expect(deque.join('')).toBe('123');
  });
})
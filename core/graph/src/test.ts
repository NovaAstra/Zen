import { PriorityQueue } from "@zen-core/queue";

class Node {
  priority: number = 0;
  maxPathPriority: number = 0; // 路径最大优先级缓存
  dependencies: Set<string> = new Set();
  dependents: Set<string> = new Set();

  constructor(public readonly id: string) { }
}

function computeMaxPathPriority(
  nodeId: string,
  nodeMap: Map<string, Node>,
  memo: Map<string, number>
): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!;

  const node = nodeMap.get(nodeId);
  if (!node) return 0;

  let maxPriority = node.priority;
  for (const depId of node.dependents) {
    const depPriority = computeMaxPathPriority(depId, nodeMap, memo);
    if (depPriority > maxPriority) maxPriority = depPriority;
  }

  memo.set(nodeId, maxPriority);
  node.maxPathPriority = maxPriority;
  return maxPriority;
}

function getReachableNodes(startNodeId: string, nodeMap: Map<string, Node>): Set<string> {
  const reachable = new Set<string>();
  const queue = [startNodeId];
  reachable.add(startNodeId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const node = nodeMap.get(currentId);
    if (!node) continue;

    for (const depId of node.dependencies) {
      if (!reachable.has(depId)) {
        reachable.add(depId);
        queue.push(depId);
      }
    }
    for (const depId of node.dependents) {
      if (!reachable.has(depId)) {
        reachable.add(depId);
        queue.push(depId);
      }
    }
  }
  return reachable;
}

function buildInDegreeMap(reachableNodes: Set<string>, nodeMap: Map<string, Node>): Map<string, number> {
  const inDegree = new Map<string, number>();
  for (const id of reachableNodes) {
    const node = nodeMap.get(id);
    if (node) {
      inDegree.set(id, node.dependencies.size);
    }
  }
  return inDegree;
}


function scheduleExecution(startNodeId: string, nodeMap: Map<string, Node>): string[] {
  const reachableNodes = getReachableNodes(startNodeId, nodeMap);

  // 先计算 maxPathPriority
  const memo = new Map<string, number>();
  for (const id of reachableNodes) {
    computeMaxPathPriority(id, nodeMap, memo);
  }

  const inDegree = buildInDegreeMap(reachableNodes, nodeMap);
  const result: string[] = [];

  // 注意这里使用大顶堆：优先级高的先出队
  // comparator 返回负数时 a 优先于 b
  // 所以这里用 b.maxPathPriority - a.maxPathPriority，maxPathPriority大的先出队
  const pq = new PriorityQueue<Node>((a, b) => b.maxPathPriority - a.maxPathPriority);

  for (const id of reachableNodes) {
    if (inDegree.get(id) === 0) {
      const node = nodeMap.get(id);
      if (node) pq.push(node);
    }
  }

  while (pq.size > 0) {
    const node = pq.poll();
    result.push(node.id);

    for (const dependentId of node.dependents) {
      if (!inDegree.has(dependentId)) continue;
      const count = inDegree.get(dependentId)! - 1;
      inDegree.set(dependentId, count);
      if (count === 0) {
        const depNode = nodeMap.get(dependentId);
        if (depNode) pq.push(depNode);
      }
    }
  }

  return result;
}

// 下面为示例创建代码，略同你之前


// ---------------- 使用示例 -----------------
const nodeMap = new Map<string, Node>();

function addNode(id: string, prio: number) {
  nodeMap.set(id, new Node(id));
  nodeMap.get(id)!.priority = prio;
}

function addDependency(from: string, to: string) {
  nodeMap.get(from)!.dependents.add(to);
  nodeMap.get(to)!.dependencies.add(from);
}

[
  ["Root", 1],
  ["A", 2], ["B", 4], ["C", 3],
  ["D", 5], ["E", 6], ["F", 2], ["G", 8],
  ["H", 1], ["I", 3], ["J", 9], ["K", 7]
].forEach(([id, prio]) => addNode(id, prio as number));

[
  ["Root", "A"], ["Root", "B"], ["Root", "C"],
  ["A", "D"], ["D", "H"],
  ["B", "E"], ["E", "I"],
  ["C", "F"], ["F", "J"],
  ["C", "G"], ["G", "K"]
].forEach(([from, to]) => addDependency(from, to));

// ---------- 执行调度 ----------
const result = scheduleExecution("Root", nodeMap);
console.log("执行顺序:", result);
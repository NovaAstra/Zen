import { PriorityQueue } from "@zen-core/queue";

class Node {
  priority = 0;
  maxPathPriority = 0;
  dependencies = new Set<string>();
  dependents = new Set<string>();

  constructor(public readonly id: string) {}
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
    maxPriority = Math.max(maxPriority, depPriority);
  }

  memo.set(nodeId, maxPriority);
  node.maxPathPriority = maxPriority;
  return maxPriority;
}

function getDownstreamReachableNodes(startNodeId: string, nodeMap: Map<string, Node>): Set<string> {
  const visited = new Set<string>();
  const queue = [startNodeId];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodeMap.get(current);
    if (!node) continue;

    for (const next of node.dependents) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

function buildInDegreeMap(subset: Set<string>, nodeMap: Map<string, Node>): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of subset) {
    const node = nodeMap.get(id);
    if (node) {
      let count = 0;
      for (const dep of node.dependencies) {
        if (subset.has(dep)) count++;
      }
      map.set(id, count);
    }
  }
  return map;
}

function scheduleExecution(startNodeId: string, nodeMap: Map<string, Node>): string[] {
  const reachable = getDownstreamReachableNodes(startNodeId, nodeMap);

  const memo = new Map<string, number>();
  for (const id of reachable) {
    computeMaxPathPriority(id, nodeMap, memo);
  }

  const inDegree = buildInDegreeMap(reachable, nodeMap);
  const result: string[] = [];

  const pq = new PriorityQueue<Node>((a, b) => b.maxPathPriority - a.maxPathPriority);

  for (const id of reachable) {
    if (inDegree.get(id) === 0) {
      const node = nodeMap.get(id);
      if (node) pq.push(node);
    }
  }

  while (pq.size > 0) {
    const node = pq.poll();
    result.push(node.id);

    for (const dependentId of node.dependents) {
      if (!reachable.has(dependentId)) continue;

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
const result = scheduleExecution("G", nodeMap);
console.log("执行顺序:", result);
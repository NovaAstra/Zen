import { DAG } from "@zen-core/graph"

const dag = new DAG()

dag.addNodes([
  { id: 'A' },
  { id: 'B' },
  { id: 'C' },
  { id: 'E' },
  { id: 'F' },
  { id: 'G', priority: 3 },
  { id: 'O' },
  { id: 'Z', priority: 4 },
  { id: 'H' },
  { id: 'L' },
  { id: 'J' },
  { id: 'M' },
  { id: 'N' },
  { id: 'P', priority: 2 },
]).addEdges([
  { source: 'A', target: 'B' },
  { source: 'A', target: 'C' },
  { source: 'B', target: 'E' },
  { source: 'E', target: 'G' },
  { source: 'G', target: 'O' },
  { source: 'O', target: 'Z' },
  { source: 'G', target: 'H' },
  { source: 'H', target: 'L' },
  { source: 'H', target: 'J' },
  { source: 'J', target: 'M' },
  { source: 'C', target: 'F' },
  { source: 'F', target: 'G' },
  { source: 'C', target: 'N' },
  { source: 'N', target: 'P' },
])

console.log(dag.order())
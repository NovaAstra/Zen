<template>
  <div style="width: 100vw; height: 100vh; overflow: auto">
    <div style="margin-bottom: 10px; position: sticky; top: 0">
      <button @click="runFrom('A')">开始</button>
      <button @click="restartFrom('A')">重置</button>
      <button @click="pauseDag">暂停</button>
      <button @click="resumeDag">恢复</button>
      <button @click="dag.boostPriority('E', 90)">提升E优先级</button>
    </div>

    <svg :width="width" :height="height" style="border: 1px solid #ccc">
      <!-- 依赖线 -->
      <line
        v-for="(edge, i) in edges"
        :key="'edge-' + i"
        :x1="nodeMap.get(edge.source)?.x"
        :y1="nodeMap.get(edge.source)?.y"
        :x2="nodeMap.get(edge.target)?.x"
        :y2="nodeMap.get(edge.target)?.y"
        stroke="black"
        stroke-width="2"
      />
      <!-- 节点 -->
      <template v-for="(node, index) in nodes">
        <g :key="index">
          <ZCircle :node="node" />
          <text
            :x="node.x"
            :y="node.y + 5"
            text-anchor="middle"
            pointer-events="none"
            fill="#333"
            font-size="12"
            font-family="Arial"
          >
            {{ node.label }}
          </text>
        </g>
      </template>

      <!-- 标签 -->
    </svg>
  </div>
</template>

<script>
import { Scheduler } from "@zen-ui/headless";
import ZCircle from "./circle.vue";

export default {
  name: "TopoGraph",
  components: {
    ZCircle,
  },
  provide() {
    return {
      root: this,
    };
  },
  props: {
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 9000 },
    nodes: {
      type: Array,
      default: () => [
        // 根节点
        { x: 600, y: 100, label: "A" }, // 0

        // 一级依赖
        { x: 300, y: 300, label: "B" }, // 1
        { x: 600, y: 300, label: "C" }, // 2
        { x: 900, y: 300, label: "D" }, // 3

        // B 的子节点（5个）
        { x: 200, y: 500, label: "H" }, // 4
        { x: 250, y: 500, label: "J" }, // 5
        { x: 300, y: 500, label: "K" }, // 6
        { x: 350, y: 500, label: "L" }, // 7
        { x: 400, y: 500, label: "Q" }, // 8  新增

        // C 的子节点（8个）
        { x: 450, y: 500, label: "Z" }, // 9
        { x: 500, y: 500, label: "E" }, // 10
        { x: 550, y: 500, label: "F" }, // 11
        { x: 600, y: 500, label: "G" }, // 12
        { x: 650, y: 500, label: "R" }, // 13 新增
        { x: 700, y: 500, label: "S" }, // 14 新增
        { x: 750, y: 500, label: "T" }, // 15 新增
        { x: 800, y: 500, label: "U" }, // 16 新增

        // D 的子节点（6个）
        { x: 850, y: 500, label: "M" }, // 17
        { x: 900, y: 500, label: "N" }, // 18
        { x: 950, y: 500, label: "P" }, // 19
        { x: 1000, y: 500, label: "V" }, // 20
        { x: 1050, y: 500, label: "W" }, // 21 新增
        { x: 1100, y: 500, label: "X" }, // 22 新增
      ],
    },
    edges: {
      type: Array,
      default: () => [
        // A → B, C, D
        { source: "A", target: "B" },
        { source: "A", target: "C" },
        { source: "A", target: "D" },

        // B → H, J, K, L, Q
        { source: "B", target: "H" },
        { source: "B", target: "J" },
        { source: "B", target: "K" },
        { source: "B", target: "L" },
        { source: "B", target: "Q" },

        // C → Z, E, F, G, R, S, T, U
        { source: "C", target: "Z" },
        { source: "C", target: "E" },
        { source: "C", target: "F" },
        { source: "C", target: "G" },
        { source: "C", target: "R" },
        { source: "C", target: "S" },
        { source: "C", target: "T" },
        { source: "C", target: "U" },

        // D → M, N, P, V, W, X
        { source: "D", target: "M" },
        { source: "D", target: "N" },
        { source: "D", target: "P" },
        { source: "D", target: "V" },
        { source: "D", target: "W" },
        { source: "D", target: "X" },
      ],
    },
  },
  data() {
    return {
      dag: new Scheduler(),
    };
  },
  computed: {
    nodeMap() {
      const map = new Map();
      this.nodes.forEach((node) => map.set(node.label, node));
      return map;
    },
  },
  mounted() {
    this.dag.launch()
    this.dag.addEdges(...this.edges);
  },
  methods: {
    runFrom(label) {
      this.dag.run(label);
    },
    restartFrom(label, force = false) {
      this.dag.restart(label, force);
    },
    pauseDag() {
      this.dag.pause();
    },
    resumeDag() {
      this.dag.resume();
    },
  },
};
</script>

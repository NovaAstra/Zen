<template>
  <div>
    <svg :width="width" :height="height" style="border: 1px solid #ccc">
      <!-- 依赖线 -->
      <line
        v-for="(edge, i) in edges"
        :key="'edge-' + i"
        :x1="nodes[edge.from].x"
        :y1="nodes[edge.from].y"
        :x2="nodes[edge.to].x"
        :y2="nodes[edge.to].y"
        stroke="black"
        stroke-width="2"
      />
      <!-- 节点 -->
      <ZCircle
        v-for="(node, index) in nodes"
        :key="'node-' + index"
        :node="node"
      />
      <!-- 标签 -->
      <text
        v-for="(node, index) in nodes"
        :key="'text-' + index"
        :x="node.x"
        :y="node.y + 5"
        text-anchor="middle"
        fill="#333"
        font-size="12"
        font-family="Arial"
      >
        {{ node.label }}
      </text>
    </svg>

    <div style="margin-top: 10px">
      <button @click="runFrom('A')">开始</button>
      <button @click="pauseDag">暂停</button>
      <button @click="resumeDag">恢复</button>
    </div>
  </div>
</template>

<script>
import { StatefulDAG } from "@zen-core/graph";
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
    width: { type: Number, default: 900 },
    height: { type: Number, default: 600 },
    nodes: {
      type: Array,
      default: () => [
        { x: 100, y: 100, label: "A" },
        { x: 250, y: 80, label: "B" },
        { x: 400, y: 120, label: "C" },
        { x: 550, y: 90, label: "D" },
        { x: 150, y: 250, label: "E" },
        { x: 350, y: 220, label: "F" },
        { x: 520, y: 270, label: "G" },
        { x: 670, y: 240, label: "H" },
        { x: 300, y: 400, label: "I" },
        { x: 450, y: 390, label: "J" },
        { x: 600, y: 420, label: "K" },
        { x: 750, y: 380, label: "L" },
      ],
    },
    edges: {
      type: Array,
      default: () => [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 0, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
        { from: 5, to: 7 }, // 分岔：F -> G 和 F -> H
        { from: 6, to: 9 },
        { from: 7, to: 10 },
        { from: 9, to: 11 },
        { from: 10, to: 11 }, // 汇合：J 和 K 都指向 L
        { from: 4, to: 8 },
        { from: 8, to: 9 },
      ],
    },
  },
  data() {
    return {
      dag: new StatefulDAG(),
    };
  },
  mounted() {
    for (const edge of this.edges) {
      const from = this.nodes[edge.from].label;
      const to = this.nodes[edge.to].label;
      this.dag.link(from, to);
    }

    console.log(this.dag.order())
  },
  methods: {
    runFrom(label) {
      this.dag.run(label);
    },
    pauseDag() {
      this.dag.pause();
      console.log("[PAUSE]");
    },
    resumeDag() {
      this.dag.resume();
      console.log("[RESUME]");
    },
  },
};
</script>

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

    <div style="margin-top: 10px">
      <button @click="runFrom('A')">开始</button>
      <button @click="pauseDag">暂停</button>
      <button @click="resumeDag">恢复</button>
    </div>
  </div>
</template>

<script>
import { Scheduler } from "@zen-core/graph";
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
        { x: 200, y: 50, label: "B" },
        { x: 300, y: 30, label: "C" },

        { x: 200, y: 150, label: "D" },
        { x: 300, y: 130, label: "E" },
        { x: 400, y: 100, label: "F" },

        { x: 300, y: 230, label: "G" },
        { x: 400, y: 250, label: "H" },
        { x: 500, y: 270, label: "I" },

        { x: 600, y: 300, label: "J" },
        { x: 700, y: 330, label: "K" },

        { x: 300, y: 400, label: "X" },
        { x: 400, y: 430, label: "Y" },
        { x: 500, y: 460, label: "Z" },
      ],
    },
    edges: {
      type: Array,
      default: () => [
        { from: 0, to: 1 }, // A → B
        { from: 1, to: 2 }, // B → C

        { from: 0, to: 3 }, // A → D
        { from: 3, to: 4 }, // D → E
        { from: 4, to: 5 }, // E → F

        { from: 3, to: 6 }, // D → G
        { from: 6, to: 7 }, // G → H
        { from: 7, to: 8 }, // H → I

        { from: 5, to: 9 }, // F → J
        { from: 8, to: 9 }, // I → J
        { from: 9, to: 10 }, // J → K

        { from: 0, to: 11 }, // A → X
        { from: 11, to: 12 }, // X → Y
        { from: 12, to: 13 }, // Y → Z
      ],
    },
  },
  data() {
    return {
      dag: new Scheduler({ maxConcurrency: 2, useIdle: true }),
    };
  },
  mounted() {
    for (const edge of this.edges) {
      const from = this.nodes[edge.from].label;
      const to = this.nodes[edge.to].label;
      this.dag.link(to, from);
    }
  },
  methods: {
    runFrom(label) {
      this.dag.run(label);
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

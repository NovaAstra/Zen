<template>
  <div style="width: 100vw;height:100vh;overflow: auto;">
    <div style="margin-bottom: 10px;position: sticky;top:0">
      <button @click="runFrom('A')">开始</button>
      <button @click="restartFrom('A')">重置</button>
      <button @click="pauseDag">暂停</button>
      <button @click="resumeDag">恢复</button>
      <button @click="runFrom('E1')">暂停时开始E1</button>
    </div>

    <svg :width="width" :height="height" style="border: 1px solid #ccc">
      <!-- 依赖线 -->
      <line v-for="(edge, i) in edges" :key="'edge-' + i" :x1="nodes[edge.from].x" :y1="nodes[edge.from].y"
        :x2="nodes[edge.to].x" :y2="nodes[edge.to].y" stroke="black" stroke-width="2" />
      <!-- 节点 -->
      <template v-for="(node, index) in nodes">
        <g :key="index">
          <ZCircle :node="node" />
          <text :x="node.x" :y="node.y + 5" text-anchor="middle" pointer-events="none" fill="#333" font-size="12"
            font-family="Arial">
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
        { x: 100, y: 100, label: "A" },
        { x: 300, y: 100, label: "B" },
        { x: 500, y: 100, label: "C" },
        { x: 700, y: 100, label: "D" },
        { x: 900, y: 100, label: "E" },
        { x: 1100, y: 100, label: "F" },

        { x: 300, y: 500, label: "B1" },
        { x: 300, y: 900, label: "B2" },
        { x: 300, y: 1300, label: "B3" },
        { x: 300, y: 1700, label: "B4" },
        { x: 300, y: 2100, label: "B5" },
        { x: 300, y: 2500, label: "B6" },
        { x: 300, y: 2900, label: "B7" },
        { x: 300, y: 3300, label: "B8" },
        { x: 300, y: 3700, label: "B9" },
        { x: 300, y: 4100, label: "B10" },
        { x: 300, y: 4500, label: "B11" },
        { x: 300, y: 4900, label: "B12" },
        { x: 300, y: 5300, label: "B13" },
        { x: 300, y: 5700, label: "B14" },
        { x: 300, y: 6100, label: "B15" },

        { x: 500, y: 500, label: "C1" },
        { x: 500, y: 900, label: "C2" },
        { x: 500, y: 1300, label: "C3" },
        { x: 500, y: 1700, label: "C4" },
        { x: 500, y: 2100, label: "C5" },
        { x: 500, y: 2500, label: "C6" },
        { x: 500, y: 2900, label: "C7" },
        { x: 500, y: 3300, label: "C8" },
        { x: 500, y: 3700, label: "C9" },
        { x: 500, y: 4100, label: "C10" },
        { x: 500, y: 4500, label: "C11" },
        { x: 500, y: 4900, label: "C12" },
        { x: 500, y: 5300, label: "C13" },

        { x: 700, y: 500, label: "D1" },
        { x: 700, y: 900, label: "D2" },
        { x: 700, y: 1300, label: "D3" },
        { x: 700, y: 1700, label: "D4" },
        { x: 700, y: 2100, label: "D5" },
        { x: 700, y: 2500, label: "D6" },
        { x: 700, y: 2900, label: "D7" },
        { x: 700, y: 3300, label: "D8" },
        { x: 700, y: 3700, label: "D9" },
        { x: 700, y: 4100, label: "D10" },
        { x: 700, y: 4500, label: "D11" },
        { x: 700, y: 4900, label: "D12" },
        { x: 700, y: 5300, label: "D13" },
        { x: 700, y: 5700, label: "D14" },
        { x: 700, y: 6100, label: "D15" },
        { x: 700, y: 6500, label: "D16" },
        { x: 700, y: 6900, label: "D17" },
        { x: 700, y: 7300, label: "D18" },

        { x: 900, y: 500, label: "E1" },
        { x: 900, y: 900, label: "E2" },
        { x: 900, y: 1300, label: "E3" },
        { x: 900, y: 1700, label: "E4" },
        { x: 900, y: 2100, label: "E5" },
        { x: 900, y: 2500, label: "E6" },
        { x: 900, y: 2900, label: "E7" },
        { x: 900, y: 3300, label: "E8" },
        { x: 900, y: 3700, label: "E9" },
        { x: 900, y: 4100, label: "E10" },
        { x: 900, y: 4500, label: "E11" },

        { x: 1100, y: 500, label: "F1" },
        { x: 1100, y: 900, label: "F2" },
        { x: 1100, y: 1300, label: "F3" },
        { x: 1100, y: 1700, label: "F4" },
        { x: 1100, y: 2100, label: "F5" },
        { x: 1100, y: 2500, label: "F6" },
        { x: 1100, y: 2900, label: "F7" },
        { x: 1100, y: 3300, label: "F8" },
        { x: 1100, y: 3700, label: "F9" },
        { x: 1100, y: 4100, label: "F10" },
        { x: 1100, y: 4500, label: "F11" },
        { x: 1100, y: 4900, label: "F12" },
        { x: 1100, y: 5300, label: "F13" },
        { x: 1100, y: 5700, label: "F14" },
        { x: 1100, y: 6100, label: "F15" }
      ],
    },
    edges: {
      type: Array,
      default: () => [
        // 水平主干连接
        { from: 0, to: 1 }, // A → B
        { from: 1, to: 2 }, // B → C
        { from: 2, to: 3 }, // C → D
        { from: 3, to: 4 }, // D → E
        { from: 4, to: 5 }, // E → F

        // B分支垂直连接
        { from: 1, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 },
        { from: 8, to: 9 }, { from: 9, to: 10 }, { from: 10, to: 11 },
        { from: 11, to: 12 }, { from: 12, to: 13 }, { from: 13, to: 14 },
        { from: 14, to: 15 }, { from: 15, to: 16 }, { from: 16, to: 17 },
        { from: 17, to: 18 }, { from: 18, to: 19 }, { from: 19, to: 20 },

        // C分支垂直连接
        { from: 2, to: 21 }, { from: 21, to: 22 }, { from: 22, to: 23 },
        { from: 23, to: 24 }, { from: 24, to: 25 }, { from: 25, to: 26 },
        { from: 26, to: 27 }, { from: 27, to: 28 }, { from: 28, to: 29 },
        { from: 29, to: 30 }, { from: 30, to: 31 }, { from: 31, to: 32 },
        { from: 32, to: 33 },

        // D分支垂直连接
        { from: 3, to: 34 }, { from: 34, to: 35 }, { from: 35, to: 36 },
        { from: 36, to: 37 }, { from: 37, to: 38 }, { from: 38, to: 39 },
        { from: 39, to: 40 }, { from: 40, to: 41 }, { from: 41, to: 42 },
        { from: 42, to: 43 }, { from: 43, to: 44 }, { from: 44, to: 45 },
        { from: 45, to: 46 }, { from: 46, to: 47 }, { from: 47, to: 48 },
        { from: 48, to: 49 }, { from: 49, to: 50 }, { from: 50, to: 51 },

        // E分支垂直连接
        { from: 4, to: 52 }, { from: 52, to: 53 }, { from: 53, to: 54 },
        { from: 54, to: 55 }, { from: 55, to: 56 }, { from: 56, to: 57 },
        { from: 57, to: 58 }, { from: 58, to: 59 }, { from: 59, to: 60 },
        { from: 60, to: 61 }, { from: 61, to: 62 },

        // F分支垂直连接
        { from: 5, to: 63 }, { from: 63, to: 64 }, { from: 64, to: 65 },
        { from: 65, to: 66 }, { from: 66, to: 67 }, { from: 67, to: 68 },
        { from: 68, to: 69 }, { from: 69, to: 70 }, { from: 70, to: 71 },
        { from: 71, to: 72 }, { from: 72, to: 73 }, { from: 73, to: 74 },
        { from: 74, to: 75 }, { from: 75, to: 76 }, { from: 76, to: 77 }

        // 已移除所有跨分支的斜向连接
      ]
    }
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

<template>
  <div style="width: 100vw; height: 100vh; overflow: auto">
    <div style="margin-bottom: 10px; position: sticky; top: 0">
      <button @click="launch">开始</button>
      <button @click="pause">暂停</button>
      <button @click="resume">恢复</button>
      <button @click="power(4)">提权节点M</button>
      <button @click="remove">删除节点D</button>
      <button @click="add">添加节点Y</button>
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
  },
  data() {
    return {
      dag: new Scheduler(),
      edges: [
        { source: "A", target: "B" },
        { source: "A", target: "C" },
        { source: "A", target: "F" },

        { source: "B", target: "D" },
        { source: "D", target: "H" },
        { source: "H", target: "M" },
        { source: "M", target: "L" },
        { source: "L", target: "Z" },

        { source: "C", target: "E" },
        { source: "E", target: "J" },
        { source: "J", target: "N" },
        { source: "N", target: "Z" },
        { source: "G", target: "P" },

        { source: "F", target: "P" },
        { source: "P", target: "Z" },

        { source: "D", target: "G" },

        { source: "Z", target: "W" },
        { source: "W", target: "O" },

        { source: "O", target: "K" },
      ],
      nodes: [
        { label: "A", x: 500, y: 100 },
        { label: "B", x: 300, y: 200 },
        { label: "C", x: 700, y: 200 },

        { label: "H", x: 100, y: 300 },
        { label: "D", x: 300, y: 300 },
        { label: "F", x: 500, y: 300 },
        { label: "E", x: 700, y: 300 },

        { label: "M", x: 100, y: 500 },
        { label: "G", x: 300, y: 500 },
        { label: "P", x: 500, y: 500 },
        { label: "J", x: 700, y: 500 },

        { label: "L", x: 100, y: 700 },
        { label: "Z", x: 500, y: 700 },
        { label: "N", x: 700, y: 700 },

        { label: "W", x: 500, y: 800 },
        { label: "O", x: 700, y: 800 },
        { label: "K", x: 1000, y: 800 },
      ],
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
    this.dag.addEdges(...this.edges);
  },
  methods: {
    launch() {
      this.dag.launch();
    },
    power(weight) {
      this.dag.updateWeight("M", weight);
    },
    pause() {
      this.dag.pause();
    },
    resume() {
      this.dag.resume();
    },
    remove() {
      this.nodes = this.nodes.filter((node) => node.label !== "D");
      const edges = this.edges.filter(
        (edge) => edge.source !== "D" || edge.target !== "D"
      );
      edges.push(...[
        { source: "B", target: "G" },
        { source: "B", target: "H" },
      ]);
      this.edges = edges;
      this.dag.remove("D");
    },
    add() {
      const schema = {
        nodes: [{ label: "Y", x: 300, y: 700 }],
        edges: [
          { source: "L", target: "Y" },
          { source: "Y", target: "Z" },
        ],
      };
      this.edges = this.edges.filter(
        (edge) => edge.source !== "L"
      );
      this.nodes.push(...schema.nodes);
      this.edges.push(...schema.edges);
      
      this.$nextTick(() => {
        this.dag.push(schema);
      })
    },
  },
};
</script>

<template>
  <circle
    :cx="node.x"
    :cy="node.y"
    :r="15"
    :fill="fillColor"
    stroke="steelblue"
    stroke-width="2"
    @click.capture="handleClick"
    style="cursor: pointer; pointer-events: all"
  />
</template>

<script>
import { Status } from "@zen-ui/headless";

export default {
  inject: ["root"],
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      status: 0,
      _priority: 0,
    };
  },
  computed: {
    id() {
      return this.node.label;
    },
    fillColor() {
      const status = this.status;
      switch (status) {
        case Status.Running:
          return "orange";
        case Status.Success:
          return "limegreen";
        case Status.Failed:
          return "crimson";
        default:
          return "skyblue";
      }
    },
  },
  created() {
    this.root.dag.addNode(this);
  },
  methods: {
    handleClick() {
      this.root.dag.run(this.node.label);
    },
    onLoad() {
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};
</script>

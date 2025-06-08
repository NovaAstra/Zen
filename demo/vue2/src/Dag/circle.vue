<template>
  <circle :cx="node.x" :cy="node.y" :r="15" :fill="fillColor" stroke="steelblue" stroke-width="2"
    @click.capture="handleClick" style="cursor: pointer; pointer-events: all" />
</template>

<script>
import { Status, StatefulNode } from "@zen-ui/headless";

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
    };
  },
  computed: {
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
    const stateNode = new StatefulNode(this.node.label, this.node.label, null);

    if (this.node.label === 'E1') {
      stateNode.priority = 100
    }

    this.node._state = stateNode;

    stateNode.onLoad = async (deps, node) => {
      const a = await new Promise((r) => setTimeout(() => r(1231), 1000));
      stateNode.data = a;
    };
    stateNode.onSuccess = (deps, node) => {
      this.status = node.status;
    };
    stateNode.onFailed = (err, deps, node) => {
      this.status = node.status;
    };
    stateNode.onFinished = (deps, node) => {
      this.status = node.status;
    };
    stateNode.onReset = (node) => {
      this.status = node.status;
    };

    this.root.dag.add(stateNode);
  },
  methods: {
    handleClick() {
      this.root.dag.restart(this.node.label);
    },
  },
};
</script>

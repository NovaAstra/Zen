<template>
  <circle
    :cx="node.x"
    :cy="node.y"
    :r="15"
    :fill="fillColor"
    stroke="steelblue"
    stroke-width="2"
    @click.prevent="handleClick"
  />
</template>

<script>
import { Status, StatefulNode } from "@zen-core/graph";

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

    this.node._state = stateNode;

    stateNode.onLoad = async (deps, node) => {
      await new Promise((r) => setTimeout(r, 2000));
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
      const stateNode = this.node;
      console.log(stateNode);
      if (stateNode) {
        this.root.dag.restart(stateNode.label);
      }
    },
  },
};
</script>

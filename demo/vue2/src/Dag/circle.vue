<template>
  <circle
    :cx="node.x"
    :cy="node.y"
    :r="15"
    :fill="fillColor"
    stroke="steelblue"
    stroke-width="2"
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
  computed: {
    fillColor() {
      const status = this.node._state?.status;
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
      console.log(`[Load] ${node.id}`, deps);
      await new Promise((r) => setTimeout(r, 500)); 
    };
    stateNode.onSuccess = (deps, node) => {
      console.log(`[Success] ${node.id}`);
    };
    stateNode.onFailed = (err, deps, node) => {
      console.log(`[Failed] ${node.id}`, err);
    };
    stateNode.onFinished = (deps, node) => {
      console.log(`[Finished] ${node.id}`);
    };
    
    this.root.dag.add(stateNode);
  },
};
</script>

<template>
  <div class="node">
    <svg width="60" height="60" @click="restart">
      <circle :fill="color" cx="30" cy="30" r="25" stroke="black" stroke-width="2" />
      <text x="30" y="35" text-anchor="middle" fill="white" font-weight="bold">
        {{ node.id }}
      </text>
    </svg>
  </div>
</template>

<script>
import { Status } from '@zen-core/graph'

export default {
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
  computed: {
    color() {
      switch (this.node.status) {
        case Status.Waiting: return '#999';
        case Status.Running: return '#3498db';
        case Status.Success: return '#2ecc71';
        case Status.Failed: return '#e74c3c';
        default: return '#999';
      }
    },
  },
  methods: {
    restart() {
      this.$emit('restart', this.node.id);
    },
  },
};
</script>

<style scoped>
.node {
  display: inline-block;
  margin: 10px;
  cursor: pointer;
  user-select: none;
}
</style>

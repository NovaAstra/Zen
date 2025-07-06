<template>
  <GridItem v-bind="mergedProps" class="zen-dashboard-widget">
    <slot></slot>
  </GridItem>
</template>

<script>
import VueGridLayout from "vue-grid-layout";
import { pick, keys } from "lodash-es";

import { withGridAttrs } from "./withGridAttrs";

export default {
  name: "ZenDashboardWidget",
  inheritAttrs: false,
  components: {
    GridItem: VueGridLayout.GridItem,
  },
  props: {
    ...VueGridLayout.GridItem.props,
  },
  data() {
    return {};
  },
  computed: {
    gridItemProps() {
      return pick(this.$props, keys(VueGridLayout.GridItem.props));
    },
    gridItemAttrs() {
      return withGridAttrs(this.gridItemProps, ["x", "y", "w", "h", "i"]);
    },
    mergedProps() {
      return {
        ...this.gridItemProps,
        ...this.gridItemAttrs,
      };
    },
  },
};
</script>
<style lang="scss" scoped>
.vue-grid-item {
  touch-action: none;
  border: 1px solid transparent;
  box-shadow: 0 2px 8px #00000014;
  background: #fff;
  border-radius: 2px;
  transition: left 0.3s, top 0.3s, height 0.3s, width 0.3s;
}
</style>

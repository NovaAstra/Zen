<template>
  <GridLayout
    v-bind="mergedProps"
    class="zen-dashboard"
    :layout="localValue"
    @layout-updated="layoutUpdated"
    @breakpoint-changed="breakpointChanged"
  >
    <template v-for="(item, index) in localValue">
      <ZenDashboardWidget v-bind="item" :key="index">
        <slot
          v-if="$scopedSlots[item.com]"
          :name="item.com"
          v-bind="item"
        ></slot>

        <slot v-else v-bind="item"></slot>
      </ZenDashboardWidget>
    </template>
  </GridLayout>
</template>

<script>
import VueGridLayout from "vue-grid-layout";
import { isEmpty, isArray, pick, keys } from "lodash-es";

import ZenDashboardWidget from "./Widget";
import { validateLayout } from "./validators";
import { withColor } from "./withColor";

export default {
  name: "ZenDashboard",
  inheritAttrs: false,
  components: {
    GridLayout: VueGridLayout.GridLayout,
    ZenDashboardWidget,
  },
  props: {
    ...VueGridLayout.GridLayout.props,
    value: {
      type: Array,
      required: true,
      validator: validateLayout,
    },
    background: {
      type: [String, Boolean],
      default: "#f5f5f5",
    },
  },
  data() {
    return {
      localValue: this.value.slice(),
    };
  },
  computed: {
    gridProps() {
      return pick(this.$props, keys(VueGridLayout.GridLayout.props));
    },
    getGridStyle() {
      const background = withColor(this.background);
      return {
        background: background,
      };
    },
    mergedProps() {
      return {
        ...this.gridProps,
        ...this.getGridStyle,
      };
    },
  },
  watch: {
    value(nv) {
      if (this.localValue !== nv) {
        this.localValue = nv.slice();
      }
    },
  },
  methods: {
    layoutUpdated(layout) {
      this.$emit("input", layout);
    },
    breakpointChanged(layout) {
      this.$emit("input", layout);
    },
    hasChildren(item) {
      return isArray(item.children) && !isEmpty(item.children);
    },
  },
};
</script>

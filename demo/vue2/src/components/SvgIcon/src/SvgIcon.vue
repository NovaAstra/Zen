<template>
  <div
    v-if="isExternal"
    :style="styleExternalIcon"
    class="zen-svg-icon is-external"
    v-on="$listeners"
  />
  <svg v-else class="zen-svg-icon" aria-hidden="true" v-on="$listeners">
    <use :xlink:href="symbolId" />
  </svg>
</template>

<script>
import { isExternal } from "@/utilties";

export default {
  name: "ZenSvgIcon",
  inheritAttrs: false,
  props: {
    prefix: {
      type: String,
      default: "icon",
    },
    name: {
      type: String,
      required: true,
    },
  },
  computed: {
    isExternal() {
      return isExternal(this.name);
    },
    symbolId() {
      return `#${this.prefix}-${this.name}`;
    },

    styleExternalIcon() {
      return {
        mask: `url(${this.name}) no-repeat 50% 50%`,
        "-webkit-mask": `url(${this.name}) no-repeat 50% 50%`,
      };
    },
  },
};
</script>

<style lang="scss">
$prefix: ".zen-svg-icon";

#{$prefix} {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;

  &.is-external {
    background-color: currentColor;
    mask-size: cover !important;
    display: inline-block;
  }
}
</style>
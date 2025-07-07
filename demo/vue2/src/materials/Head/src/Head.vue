<template>
  <div class="zen-head flex items-center px-4 h-full w-full">
    <div class="zen-head__left inline-flex items-center gap-x-4">
      <ZenSvgIcon name="dashboard" />
      <span class="zen-head-title"
        >AI Ticket Sentiment Analysis For ConnectWise
      </span>
    </div>
    <div class="zen-head__right inline-flex items-center">
      <ZenSvgIcon name="logo" />
    </div>
  </div>
</template>

<script>
import { ZenSvgIcon } from "@/components";

export default {
  name: "ZenHead",
  inheritAttrs: false,
  components: {
    ZenSvgIcon,
  },
  props: {},
};
</script>

<style lang="scss">
$prefix: ".zen-head";

#{$prefix} {
  background: #fff;

  &-title {
    color: #303133;
    font-size: 20px;
    font-weight: 700;
  }
}
</style>
<template>
  <div class="zen-head flex items-center px-4 h-full w-full justify-between">
    <div class="zen-head__left inline-flex items-center gap-x-4">
      <ZenIcon
        :name="icon"
        background="linear-gradient(203deg, #17B3A3 5.4%, #4A83E8 63.38%, #6D74FF 94.6%)"
      />
      <span class="zen-head-title truncate">
        {{ title }}
      </span>
    </div>
    <div class="zen-head__right inline-flex items-center hidden md:block">
      <ElImage :src="logo" />
    </div>
  </div>
</template>

<script>
import { ZenIcon } from "@/components";

export default {
  name: "ZenHead",
  inheritAttrs: false,
  components: {
    ZenIcon,
  },
  props: {
    title: {
      type: String,
      default: "AI Ticket Sentiment Analysis For ConnectWise",
    },
    icon: {
      type: String,
      default: "dashboard|svg",
    },
    logo: {
      type: String,
      default: "",
    },
  },
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
    max-width: 455px;
  }

  .el-image {
    height: 40px;
    min-width: 190px;
  }
}
</style>
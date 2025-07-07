<template>
  <div class="zen-menu-item h-full flex items-center gap-x-2 relative">
    <slot name="icon">
      <ZenIcon class="zen-menu-item-icon" v-if="icon" :name="icon" />
    </slot>

    <slot>
      <span class="zen-menu-item-title">{{ title }}</span>
    </slot>

    <slot name="tag"> </slot>
  </div>
</template>

<script>
import { ZenIcon } from "@/components";

export default {
  name: "ZenMenuItem",
  inheritAttrs: false,
  components: {
    ZenIcon,
  },
  props: {
    icon: String,
    title: String,
  },
};
</script>

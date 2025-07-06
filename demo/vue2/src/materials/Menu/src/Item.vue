<template>
  <div class="zen-menu-item h-full flex items-center gap-x-2 relative">
    <slot name="icon">
      <span class="zen-menu-item-icon" v-if="icon">{{ icon }}</span>
    </slot>

    <slot>
      <span class="zen-menu-item-title">{{ title }}</span>
    </slot>

    <slot name="tag"> </slot>
  </div>
</template>

<script>
export default {
  name: "ZenMenuItem",
  inheritAttrs: false,
  props: {
    icon: String,
    title: String,
  },
};
</script>

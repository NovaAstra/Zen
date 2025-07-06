<template>
  <div class="zen-material">
    <slot name="head"></slot>
    <slot></slot>
    <slot name="foot"></slot>
  </div>
</template>

<script>
export default {
  name: "ZenMaterial",
};
</script>

<style lang="scss" scoped>
.zen-material{
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>

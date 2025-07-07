<template>
  <div class="zen-divider px-4 w-full">
    <div class="zen-divider-line"></div>
  </div>
</template>

<script>
export default {
  name: "ZenDivider",
};
</script>

<style lang="scss">
$prefix: ".zen-divider";

#{$prefix} {
  &-line {
    height: 1px;
    background: #eaecf0;
  }
}
</style>
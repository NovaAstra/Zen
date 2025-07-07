<template>
  <div class="zen-auth p-4 flex items-center gap-x-3 cursor-pointer">
    <ElAvatar
      class="shrink-0"
      src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
    />

    <div class="flex flex-col flex-1">
      <span class="zen-auth-name">Sophia Williams</span>
      <span class="zen-auth-email truncate">sophia@mspbots.ai</span>
    </div>
    <i class="el-icon-arrow-right"></i>
  </div>
</template>

<script>
export default {
  name: "ZenAuth",
  inheritAttrs: false,
};
</script>

<style lang="scss">
$prefix: ".zen-auth";

#{$prefix} {
  line-height: 18px;
  font-size: 12px;

  &-name {
    color: #344054;
    font-weight: 500;
  }
  &-email {
    color: #475467;
    font-weight: 400;
  }

  .el-icon-arrow-right {
    color: #667085;
    font-size: 14px;
    font-weight: bold;
  }
}
</style>
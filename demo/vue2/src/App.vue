<template>
  <div>
    <router-link to="/foo">状态依赖演示</router-link>
    <br>
    <router-link to="/bar">可视区域优先级演示</router-link>

    <router-view></router-view>
  </div>
</template>

<script>
export default {};
</script>
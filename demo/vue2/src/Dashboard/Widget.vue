<template>
  <div class="widget">
    <div v-if="visible">可见</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      loading: false,
    };
  },
};
</script>

<style scoped>
.widget {
  width: 100%;
  height: 100%;
}
</style>
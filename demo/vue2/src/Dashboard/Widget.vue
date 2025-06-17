<template>
  <div class="widget">
    <div v-if="visible">可见</div>
    <div v-if="loading">Loading</div>
    <slot />
  </div>
</template>

<script>
export default {
  inject: ["root"],
  data() {
    return {
      visible: false,
      loading: false,
      priority: 1,
    };
  },
  mounted() {
    this.root.scheduler.observe(this.$el, this);
  },
  beforeDestory() {
    this.root.scheduler.unobserve(this.$el);
  },
  methods: {
    fetchData() {
      return new Promise((resove) => {
        setTimeout(() => {
          resove();
        }, 2000);
      });
    },
  },
};
</script>

<style scoped>
.widget {
  width: 100%;
  height: 100%;
  border: 1px solid red;
}
</style>
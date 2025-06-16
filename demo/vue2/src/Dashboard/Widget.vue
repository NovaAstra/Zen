<template>
  <div class="widget">
    <div v-if="visible">可见</div>

    <div v-if="loading">Loading</div>
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
  mounted() {
    this.scheduler.observe(this.$el, this);
  },
  beforeDestory() {
    this.scheduler.unobserve(this.$el);
  },
  methods: {
    fetchData() {
      this.visible = true;
      this.loading = true;
      return new Promise((resove) => {
        setTimeout(() => {
          this.loading = false;
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
}
</style>
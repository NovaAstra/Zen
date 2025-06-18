<template>
  <div class="widget">
    {{ name }}
    <div v-if="visible">可见</div>
    <div v-if="loading">Loading</div>
  </div>
</template>

<script>
export default {
  inject: ["root"],
  props: {
    id: String,
    name: String,
    priority: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      status: 0,
      visible: false,
      loading: true,
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
          console.log(this.name);
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

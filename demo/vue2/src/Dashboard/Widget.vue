<template>
  <div class="widget" @click="root.scheduler.reset(id)">
    {{ name }}
    <div v-if="visible">可见</div>
    <div v-if="loading">Loading</div>
  </div>
</template>

<script>
const sleep = (time = 1000) =>
  new Promise((resolve) => setTimeout(resolve, time));

export default {
  inject: ["root"],
  props: {
    id: String,
    name: String,
    p: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      status: 0,
      priority: this.p,

      visible: false,
      loading: true,

      done: null,
    };
  },
  mounted() {
    this.root.scheduler.observe(this.$el, this);
  },
  beforeDestory() {
    this.root.scheduler.unobserve(this.$el);
  },
  methods: {
    async onSetup() {
      console.log(this.name);
    },

    onDone() {
      return new Promise((resolve) => {
        this.done = resolve;
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

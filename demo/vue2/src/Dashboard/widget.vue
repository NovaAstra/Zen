<template>
  <section class="b-widget flex" v-if="compat"></section>

  <section class="b-widget flex flex-col" v-else>
    <header class="b-widget-head" v-if="hasHead"></header>

    <main class="b-widget-body flex-1"></main>

    <footer class="b-widget-foot" v-if="hasFoot"></footer>
  </section>
</template>

<script>
export default {
  name: "BWidget",
  inheritAttrs: false,
  components: {
    BWidgetPaywall: () => import("./paywall"),
    BWidgetLoading: () => import("./loading"),
    BWidgetError: () => import("./error"),
  },
  props: {
    hasHead: {
      type: Boolean,
      default: true,
    },
    hasFoot: {
      type: Boolean,
      default: true,
    },
    gadget: {
      type: Object,
      default: () => ({}),
    },
    config: {
      type: Object,
      default: () => ({}),
    },

    compat: Boolean,
  },
  data() {
    return {
      visible: false,
      loading: false,

      context: null,
    };
  },
  methods: {},
};
</script>

<style  scoped>
.b-widget {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
}

.flex {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.flex-col {
  flex-direction: column;
}
</style>

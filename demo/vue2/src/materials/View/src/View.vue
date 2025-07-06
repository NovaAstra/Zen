<template>
  <div class="zen-view w-full h-full overflow-auto">
    <iframe
      v-if="useIframe"
      :src="useIframe"
      sandbox="allow-scripts allow-same-origin"
      frameborder="0"
      referrerpolicy="no-referrer"
    ></iframe>

    <ZenDashboard v-else-if="userDynamic" />

    <router-view v-else></router-view>
  </div>
</template>

<script>
import { validateURL } from "@/utilties";
import { ZenDashboard } from "@/components";

export default {
  name: "ZenView",
  inheritAttrs: false,
  components: {
    ZenDashboard,
  },
  computed: {
    useIframe() {
      return validateURL(this.$route.meta?.iframe);
    },
    userDynamic() {
      return this.$store.dashboard?.dynamic ?? false;
    },
  },
};
</script>

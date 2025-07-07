<template>
  <ZenLayout>
    <template #head>
      <ZenHead />
    </template>
    <template #side>
      <ZenMenu :menus="menus" class="flex-1" />
      <ZenDivider />
      <ZenAuth />
    </template>
  </ZenLayout>
</template>

<script>
import { ZenLayout } from "./components";
import { ZenHead, ZenMenu, ZenAuth, ZenDivider } from "./materials";

export default {
  name: "App",
  components: {
    ZenLayout,
    ZenHead,
    ZenMenu,
    ZenAuth,
    ZenDivider,
  },
  data() {
    return {
      menus: [
        {
          name: "0",
          path: "0",
          meta: {
            title: "Home",
            icon: "home|svg",
          },
        },
        {
          name: "1",
          path: "1",
          meta: {
            title: "Sentiment Analysis Results",
            icon: "analysis|svg",
          },
        },
        {
          name: "2",
          path: "2",
          meta: {
            title: "Tickets",
            icon: "robot|svg",
          },
          children: [
            {
              title: "Analysis",
              name: "3",
              path: "3",
              meta: {
                title: "Analysis",
              },
            },
            {
              name: "4",
              path: "4",
              meta: {
                title: "Alert",
              },
            },
            {
              name: "5",
              path: "5",
              meta: {
                title: "REST API Write-Back",
              },
            },
          ],
        },
        {
          name: "7",
          path: "7",
          meta: {
            title: "Settings",
            icon: "setting|svg",
            stick: true,
          },
        },
        {
          name: "8",
          path: "8",
          meta: {
            title: "Refresh",
            icon: "refresh|svg",
            stick: true,
          },
        },
      ],
    };
  },
};
</script>

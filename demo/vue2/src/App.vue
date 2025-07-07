<template>
  <ZenLayout>
    <template #head>
      <ZenHead />
    </template>
    <template #side>
      <ZenMenu :menus="menus"/>
    </template>
  </ZenLayout>
</template>

<script>
import { ZenLayout } from "./components";
import { ZenHead,ZenMenu } from "./materials";

export default {
  name: "App",
  components: {
    ZenLayout,
    ZenHead,
    ZenMenu
  },
  data() {
    return {
      menus: [
        {
          name: "0",
          path: "0",
          meta: {
            title: "Home",
          },
        },
        {
          name: "1",
          path: "1",
          meta: {
            title: "Sentiment Analysis Results",
          },
        },
        {
          title: "Tickets",
          name: "2",
          path: "2",
          meta: {
            title: "Tickets",
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
      ],
    };
  },
};
</script>

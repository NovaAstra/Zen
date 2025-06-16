<template>
  <div class="dashboard">
    <grid-layout
      :layout.sync="layout"
      :col-num="12"
      :row-height="30"
      :is-draggable="true"
      :is-resizable="true"
      :is-mirrored="false"
      :vertical-compact="true"
      :margin="[10, 10]"
      :use-css-transforms="true"
    >
      <grid-item
        v-for="item in layout"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :key="item.i"
      >
        <Widget />
      </grid-item>
    </grid-layout>
  </div>
</template>

<script>
import VueGridLayout from "vue-grid-layout";
import { Scheduler } from "@zen-ui/headless";
import Widget from "./Widget.vue";

export default {
  provide() {
    return {
      root: this,
    };
  },
  components: {
    GridLayout: VueGridLayout.GridLayout,
    GridItem: VueGridLayout.GridItem,
    Widget,
  },
  data() {
    return {
      layout: [
        {
          h: 3,
          i: "9b92a662-f02e-4d85-b1ff-fa4fdb050398",
          w: 12,
          x: 0,
          y: 0,
          id: "1861360570108870658",
          com: "pageheadergadget",
          moved: false,
          static: true,
          showSetting: "show",
        },
        {
          h: 16,
          i: "14b261b8-0bda-4acf-82ca-e9752e42f022",
          w: 3,
          x: 0,
          y: 0,
          id: "1861359925314322433",
          com: "sunburstgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Sunburst",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "162e7b62-dd40-48bb-b3ab-1aa6a3927185",
          w: 5,
          x: 3,
          y: 88,
          id: "1861352529514856449",
          com: "chartgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Line",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "2483f690-d89f-4ede-a4f8-3983ec9d1398",
          w: 3,
          x: 0,
          y: 88,
          id: "1861352795748302850",
          com: "processgaugegadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Progress",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "5c7f711c-f921-4fdd-aea8-cdc5a6d72a01",
          w: 3,
          x: 0,
          y: 104,
          id: "1861352120415027202",
          com: "cardnumbergadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Card Number",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 20,
          i: "7220344d-c555-4155-9a5b-b7138a8599cb",
          w: 4,
          x: 0,
          y: 68,
          id: "1861353505957216258",
          com: "pvtablegadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - PvTable",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "86c3911b-6ccc-4d94-85c3-c33bbf3aae14",
          w: 6,
          x: 6,
          y: 16,
          id: "1861356578389753857",
          com: "drilldowntreemapgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Tree Map",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "893dfddb-43a6-497c-8b75-b1bef894d804",
          w: 9,
          x: 3,
          y: 104,
          id: "1861351871772491777",
          com: "gridgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: true,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Grid",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 20,
          i: "89ad281c-63ac-45d9-a192-1085fd3867cb",
          w: 3,
          x: 9,
          y: 68,
          id: "1861353115954053121",
          com: "heatmapgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - HeatMap",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 17,
          i: "91102910-d199-41e3-8ef3-b26b9665b0a8",
          w: 3,
          x: 4,
          y: 32,
          id: "1861355978759471105",
          com: "scattergadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Scatart",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "959fd436-ba66-4731-83f3-b7c2b50f0f13",
          w: 6,
          x: 6,
          y: 0,
          id: "1861358710622912514",
          com: "usertimezoneinfocardgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "No integration",
              code: "No integration",
              icon: "NO_ICON",
            },
          ],
          name: "All - Widget - Time",
          businessType: "Custom",
          integrationCode: ["No integration"],
        },
        {
          h: 19,
          i: "a044933d-1ab9-4a64-8f03-534888908f2e",
          w: 5,
          x: 4,
          y: 49,
          id: "1861354248646819842",
          com: "hierarchygridgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: true,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Hierarchy Grid",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 17,
          i: "ac4a2b1b-68d6-43c1-88ae-845952ef872b",
          w: 5,
          x: 7,
          y: 32,
          id: "1861355208039333889",
          com: "crudformgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: true,
          integrationList: [
            {
              name: "Uncategorized",
              code: "UNCATEGORIZED",
              icon: "https://oss.mspbots.ai/app/mspbots_theme_icon/form_view.png",
            },
          ],
          name: "All Widget - CRUD Form",
          businessType: "Custom",
          integrationCode: ["UNCATEGORIZED"],
        },
        {
          h: 20,
          i: "b3dec9b2-224f-442e-ae56-2b710df0f155",
          w: 5,
          x: 4,
          y: 68,
          id: "1861353349501288450",
          com: "piechartgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Pie",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 19,
          i: "b942a398-bd0d-4331-83f4-b3d117877d38",
          w: 3,
          x: 9,
          y: 49,
          id: "1861353837726662657",
          com: "htmleditorgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "No integration",
              code: "No integration",
              icon: "NO_ICON",
            },
          ],
          name: "All Widget - HTML",
          businessType: "Custom",
          integrationCode: ["No integration"],
        },
        {
          h: 19,
          i: "cb56d274-7c89-4c1d-8f85-f22af60d16b8",
          w: 4,
          x: 0,
          y: 49,
          id: "1861354600779612161",
          com: "charthourglassgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Funnel",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 16,
          i: "cd4ca9c4-006a-4c92-8585-9616f6182ecf",
          w: 6,
          x: 0,
          y: 16,
          id: "1861358953322119169",
          com: "ganttgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Gantt",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 17,
          i: "d8f157ef-7374-477b-8db3-15326da961a3",
          w: 4,
          x: 0,
          y: 32,
          id: "1861355755635081217",
          com: "formviewdatagadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Uncategorized",
              code: "UNCATEGORIZED",
              icon: "https://oss.mspbots.ai/app/mspbots_theme_icon/form_view.png",
            },
          ],
          name: "All Widget - Form View",
          businessType: "Custom",
          integrationCode: ["UNCATEGORIZED"],
        },
        {
          h: 16,
          i: "de143f17-55a1-4bd9-8475-177680ee1282",
          w: 3,
          x: 3,
          y: 0,
          id: "1861359482840416257",
          com: "bar3dchartgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - 3D",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
        {
          h: 2,
          i: "e15b56f0-0daa-450c-9ce0-c60de150af4d",
          w: 4,
          x: 0,
          y: 120,
          id: "1925115379575816194",
          com: "dropdownlistgadget",
          moved: false,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "ConnectWise Manage - API",
              code: "CW",
              icon: "https://oss.mspbots.ai/files/integration_logo/connectwise_manage_logo.png",
            },
          ],
          name: "Priority_Service Desk Dashboard_clone_2025-05-21T09:04:08Z",
          isHidden: 0,
          businessType: "Custom",
          integrationCode: ["CW"],
        },
        {
          h: 16,
          i: "f29d6b36-4ca7-42f9-ac0b-f6ce6adfc07e",
          w: 4,
          x: 8,
          y: 88,
          id: "1861352327064190978",
          com: "barchartgadget",
          moved: false,
          isHidden: 0,
          isCompany: false,
          allowPaging: null,
          integrationList: [
            {
              name: "Teams",
              code: "TEAMS",
              icon: "https://oss.mspbots.ai/files/integration_logo/teams_logo.png",
            },
          ],
          name: "All Widget - Columns",
          businessType: "Custom",
          integrationCode: ["TEAMS"],
        },
      ],
      scheduler: new Scheduler(),
    };
  },
};
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  overflow: auto;
  background-color: #f8f8f8;
}

.vue-grid-item {
  background-color: #ffffff;
}
</style>
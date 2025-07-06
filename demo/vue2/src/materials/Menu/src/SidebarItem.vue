<template>
  <ElMenuItem
    class="zen-sidebar-item !leading-none overflow-hidden"
    v-if="!item.children"
    :index="item.path"
  >
    <ZenMenuItem :icon="item.meta && item.meta.icon" :title="item.meta.title">
      <template v-for="tag in getSlotTags" v-slot:[tag]>
        <slot :name="`${item.name}-${tag}`" />
      </template>
    </ZenMenuItem>
  </ElMenuItem>

  <ElSubmenu class="zen-sidebar-item" v-else :index="item.path">
    <template slot="title">
      <ZenMenuItem
        v-if="item.meta"
        :icon="item.meta && item.meta.icon"
        :title="item.meta.title"
      >
        <template v-for="tag in getSlotTags" v-slot:[tag]>
          <slot :name="`${item.name}-${tag}`" />
        </template>
      </ZenMenuItem>
    </template>

    <ZenSidebarItem
      v-for="child in item.children"
      :key="child.path"
      :item="child"
    >
      <template v-for="tag in getSlotTags" v-slot:[`${child.name}-${tag}`]>
        <slot :name="`${child.name}-${tag}`" />
      </template>
    </ZenSidebarItem>
  </ElSubmenu>
</template>

<script>
import ZenMenuItem from "./Item.vue";

export default {
  name: "ZenSidebarItem",
  inheritAttrs: false,
  components: {
    ZenMenuItem,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  computed: {
    getSlotTags() {
      return ["icon", "default", "tag"];
    },
  },
};
</script>

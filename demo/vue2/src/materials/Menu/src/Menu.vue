<template>
  <div v-bind="mergedProps" class="zen-menu w-full py-4">
    <ElMenu class="h-full">
      <ZenSidebarItem
        :key="item.path"
        :item="item"
        :index="index"
        v-for="(item, index) in menus"
        :style="getStickStyle(item)"
      >
        <template v-for="tag in getSlotTags" v-slot:[`${item.name}-${tag}`]>
          <slot :name="`${item.name}-${tag}`" />
        </template>
      </ZenSidebarItem>
    </ElMenu>
  </div>
</template>

<script>
import { get } from "lodash-es";
import { withColor } from "@/utilties";
import ZenSidebarItem from "./SidebarItem.vue";
import ZenMenuItem from "./Item.vue";

export default {
  name: "ZenMenu",
  inheritAttrs: false,
  provide() {
    return {
      menu: this,
    };
  },
  components: {
    ZenMenuItem,
    ZenSidebarItem,
  },
  props: {
    background: {
      type: [Boolean, String],
      default: "#ffffff",
    },
    menus: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    this.stickTotal = 0;
    return {};
  },
  computed: {
    getMenuStyle() {
      const background = withColor(this.background);
      return {
        background: background,
      };
    },
    mergedProps() {
      return {
        ...this.getMenuStyle,
      };
    },
    getSlotTags() {
      return ["icon", "name", "tag"];
    },
  },
  methods: {
    getStickStyle(item) {
      const stick = get(item, "meta.stick", false);

      if (!stick) return {};

      return {
        position: "absolute",
        bottom: this.stickTotal++ * 34 + "px",
      };
    },
  },
};
</script>

<style lang="scss">
$prefix: ".zen-menu";
$prefix-menu-item: #{$prefix}-item;
$prefix-sidebar-item: ".zen-sidebar-item";

#{$prefix} {
  @mixin el-menu-font {
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    color: #344054;
  }

  .el-menu {
    border-right: none;

    #{$prefix-sidebar-item}.el-menu-item {
      height: 34px;
      padding: 0 12px !important;
      transition: background-color 0.3s ease;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
      }

      &.is-active {
        background-color: transparent;

        #{$prefix-menu-item} {
          color: #182230;

          &-icon{
            color: #158DEF;
          }

          &::before {
            background-color: #f2f4f7;
            border-radius: 8px;
            left: 0;
            right: 0;
          }
        }

        &::before {
          background-color: #158def;
          height: 20px;
        }
      }

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        width: 4px;
        height: 0;
        transform: translateY(-50%);
        background: transparent;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        z-index: 2;
        transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #{$prefix-menu-item} {
        @include el-menu-font;
        padding: 0 12px;
        z-index: 1;
        color: #344054;
        transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);

        &::before {
          content: "";
          position: absolute;
          top: 0;
          right: -12px;
          left: -12px;
          bottom: 0;
          background-color: transparent;
          z-index: -1;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }

      &:hover,
      &:focus {
        background: transparent;

        #{$prefix-menu-item} {
          &::before {
            background-color: #f2f4f7;
          }
        }
      }
    }

    #{$prefix-sidebar-item}.el-submenu {
      .el-submenu__title {
        height: 34px;
        padding: 0 12px !important;
        transition: background-color 0.3s ease;

        &:hover,
        &:focus {
          background-color: #f2f4f7;
        }
      }

      #{$prefix-menu-item} {
        @include el-menu-font;
        padding: 0 12px;
        z-index: 1;
        color: #344054;
        transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .el-menu {
        margin-top: 8px;
      }
    }
  }
}
</style>

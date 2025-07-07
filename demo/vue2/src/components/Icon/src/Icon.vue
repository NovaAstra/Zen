<script>
import { getSize, withColor } from "@/utilties";

import ZenSvgIcon from "./SvgIcon.vue";

const SVG_END_WITH_FLAG = "|svg";

const Depth = {
  1: 0.82,
  2: 0.72,
  3: 0.38,
  4: 0.24,
  5: 0.18,
};

export default {
  name: "ZenIcon",
  inheritAttrs: false,
  components: {
    ZenSvgIcon,
  },
  props: {
    name: [String, Object],
    size: {
      type: [Number, String],
      default: 14,
    },
    color: String,
    background: String,
    raduis: {
      type: [Number, String],
      default: 4,
    },
    depth: Number,
    rotate: {
      type: [Number, String],
      default: 0,
    },
    disabled: Boolean,
  },
  computed: {
    mergedStyle() {
      const { size, color, rotate, depth, background, raduis } = this;

      let css = {
        background: background,
        fontSize: getSize(size),
        color,
        borderRadius: getSize(raduis),
      };

      if (rotate === "infinite") {
        css.animation = "rotate 2s linear infinite";
      } else if (typeof rotate === "number") {
        css.transform = `rotate(${rotate}deg)`;
      }

      if (depth !== undefined) {
        css.color = withColor(color);
      }

      return css;
    },
  },
  methods: {
    renderIcon(h) {
      const { name, depth } = this;

      if (typeof name === "object") return h(name);

      if (typeof name === "string") {
        if (name.endsWith(SVG_END_WITH_FLAG))
          return <ZenSvgIcon name={name.replace(SVG_END_WITH_FLAG, "")} />;

        return <i class={[this.name]} style={{ opacity: Depth[depth] }}></i>;
      }

      return this.$slots.default;
    },
  },
  render(h) {
    const { depth, mergedStyle, disabled } = this;

    return (
      <span
        class={[
          "zen-icon inline-flex items-center relative justify-center",
          {
            "b-icon--depth": depth,
            "b-icon--color-transition": depth !== undefined,
            "is-disabled": disabled,
          },
        ]}
        role="img"
        style={[mergedStyle]}
        on={!disabled && this.$listeners}
      >
        {this.renderIcon(h)}
      </span>
    );
  },
};
</script>


<style lang="scss">
$prefix: ".zen-icon";

#{$prefix} {
  min-height: 24px;
  min-width: 24px;
  fill: currentColor;
  transition: all 0.4s cubic-bezier(0.645, 0.045, 0.355, 1);
  cursor: pointer;

  &.is-disabled {
    cursor: not-allowed !important;
    opacity: 0.7;
  }

  &--depth {
    svg,
    i {
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  &--color-transition {
    transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  svg {
    height: 1em;
    width: 1em;
    vertical-align: -0.19em;

    &:not(:root) {
      overflow-clip-margin: content-box;
      overflow: hidden;
    }
  }

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
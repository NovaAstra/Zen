<template>
  <svg  aria-hidden="true">
    <use :xlink:href="symbolId" />
  </svg>
</template>

<script>
export default {
  name: "ZenSvgIcon",
  inheritAttrs: false,
  props: {
    prefix: {
      type: String,
      default: "icon",
    },
    name: {
      type: String,
      required: true,
    },
  },
  computed: {
    symbolId() {
      return `#${this.prefix}-${this.name}`;
    },
  },
};
</script>
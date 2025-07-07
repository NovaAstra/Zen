<template>
  <div class="zen-layout relative inset-0">
    <header class="zen-layout__head absolute inset-x-0">
      <slot name="head"></slot>
    </header>
    <aside class="zen-layout__side absolute bottom-0 left-0 flex flex-col">
      <slot name="side"></slot>
    </aside>
    <main class="zen-layout__body absolute bottom-0 right-0 overflow-y-auto">
      <slot></slot>
    </main>
    <footer class="zen-layout__foot absolute">
      <slot name="foot"></slot>
    </footer>
  </div>
</template>

<script>
export default {
  name: "ZenLayout",
  inheritAttrs: false,
};
</script>

<style lang="scss">
$prefix: ".zen-layout";

#{$prefix} {
  background-color: #ffffff;
  height: 100vh;
  overflow: hidden;

  &__head {
    height: 56px;
    border-bottom: 1px solid #d0d5dd;
  }

  &__side {
    width: 248px;
    top: 56px;
    border-right: 1px solid #d0d5dd;
  }

  &__body {
    left: 248px;
    top: 56px;
  }
}
</style>
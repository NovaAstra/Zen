<template>
  <section>
    <header>
      <slot name="header"></slot>
    </header>
    <aside>
      <slot name="aside"></slot>
    </aside>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import { defineProps } from "vue-demi";
import { type LayoutProps } from "./Layout.props";
import { useLayout } from "./useLayout";

const props = defineProps<LayoutProps>();

useLayout(props);
</script>

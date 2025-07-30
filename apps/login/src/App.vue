<template>
  <div class="login">
    <!-- <button @click="handleLogin">登录</button> -->
  </div>
</template>

<script lang="ts" setup>
// import { login } from "@zen-core/msal";

// const handleLogin = () => {
//   login("http://localhost:8081");
// };

import { parse } from '@zen-core/scast';
const code = `@include when(hit) {
    border-color: $--tag-primary-color;
  }

  .el-tag__close {
    color: mix($--tag-primary-color, $--color-white, $fontColorWeight);
    &:hover {
      color: $--color-white;
      background-color: mix($--tag-primary-color, $--color-white, $hoverColorWeight);
    }
  }
`

// parse(code).stylesheet()
</script>

<style lang="css" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}
</style>

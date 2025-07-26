<template>
  <div class="login">
    <button @click="handleLogin">登录</button>
  </div>
</template>

<script lang="ts" setup>
import { login } from "@zen-core/msal";

const handleLogin = () => {
  login("http://localhost:8081");
};
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

<script setup lang="ts">
const openPopup = () => {
  const redirectUri = encodeURIComponent("http://localhost:3000/auth-callback");
  window.location.href = `http://localhost:8081/login?redirect_uri=${redirectUri}`;
};
</script>

<template>
  <button @click="openPopup">登录</button>
</template>

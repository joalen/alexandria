<template>
  <div :class="`theme-${theme} term-root`">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { theme } = useTheme()
</script>
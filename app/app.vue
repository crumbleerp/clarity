<script setup lang="ts">
useHead({
  titleTemplate: chunk => `Clarity${chunk ? ` | ${chunk}` : ''}`
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

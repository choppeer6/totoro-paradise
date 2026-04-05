<script setup lang="ts">
// 嵌入版本 - 无顶部导航栏
const appConfig = useAppConfig();

useHead({
  title: '龙猫乐园'
})
</script>
<script lang="ts">
if (typeof window !== 'undefined') {
  window.global = window;
}
</script>
<template>
  <VApp>
    <VMain>
      <div class="p-4">
        <NuxtPage />
        <p class="mt-4 text-xs text-center text-grey">
          Powered by totoro-paradise v{{ appConfig.version }}
        </p>
      </div>
    </VMain>
  </VApp>
</template>

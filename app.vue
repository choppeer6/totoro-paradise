<script setup lang="ts">
const appConfig = useAppConfig();
const route = useRoute();

// 根据路由动态设置标题
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '龙猫乐园 - 登录',
    '/scanned': '龙猫乐园 - 控制台',
    '/batch': '龙猫乐园 - 批量操作',
    '/decode': '龙猫乐园 - 解码',
  };
  return titles[route.path] || '龙猫乐园';
});

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: '龙猫校园第三方客户端 - 无需MITM' },
    { name: 'theme-color', content: '#6366f1' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap' },
  ],
});
</script>

<script lang="ts">
if (typeof window !== 'undefined') {
  window.global = window;
}
</script>

<template>
  <VApp class="totoro-app">
    <!-- 顶部导航 -->
    <VAppBar
      class="app-bar"
      elevation="0"
      :height="64"
    >
      <div class="app-bar-content">
        <div class="brand">
          <VIcon icon="i-mdi-run-fast" class="brand-icon" />
          <VAppBarTitle class="brand-text">龙猫乐园</VAppBarTitle>
        </div>

        <VSpacer />

        <div class="nav-links d-none d-sm-flex">
          <VBtn
            variant="text"
            href="https://github.com/BeiyanYunyi/totoro-paradise"
            target="_blank"
            rel="noopener noreferrer"
            class="nav-btn"
          >
            <VIcon start icon="i-mdi-github" />
            GitHub
          </VBtn>
        </div>
      </div>
    </VAppBar>

    <!-- 主内容区 -->
    <VMain class="main-content">
      <div class="content-wrapper">
        <NuxtPage />
      </div>

      <!-- 页脚 -->
      <footer class="app-footer">
        <div class="footer-content">
          <span class="version">v{{ appConfig.version }}</span>
          <span class="divider">·</span>
          <span class="copyright">Made with ❤️ by BeiyanYunyi & Clansty</span>
        </div>
      </footer>
    </VMain>
  </VApp>
</template>

<style>
/* 全局样式变量 */
:root {
  --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --surface-color: #ffffff;
  --background-color: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-color: #1e293b;
    --background-color: #0f172a;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
  }
}

/* 基础样式 */
.totoro-app {
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif !important;
  background: var(--background-color) !important;
}

/* 顶部导航栏 */
.app-bar {
  background: var(--surface-color) !important;
  border-bottom: 1px solid var(--border-color);
}

.app-bar-content {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  font-size: 28px;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.nav-btn {
  text-transform: none;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.nav-btn:hover {
  color: var(--text-primary);
}

/* 主内容区 */
.main-content {
  background: var(--background-color);
  min-height: calc(100vh - 64px);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页脚 */
.app-footer {
  margin-top: auto;
  padding: 24px;
  border-top: 1px solid var(--border-color);
  background: var(--surface-color);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.footer-content .divider {
  margin: 0 8px;
  opacity: 0.5;
}

/* Vuetify 组件样式覆盖 */
.v-card {
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-md) !important;
  border: 1px solid var(--border-color);
  background: var(--surface-color) !important;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.v-card:hover {
  box-shadow: var(--shadow-lg) !important;
}

.v-btn {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0;
  border-radius: var(--radius-md) !important;
}

.v-btn--variant-elevated {
  background: var(--primary-gradient) !important;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

/* 响应式 */
@media (max-width: 600px) {
  .content-wrapper {
    padding: 16px;
  }

  .app-bar-content {
    padding: 0 16px;
  }
}
</style>

<script setup lang="ts">
import TotoroApiWrapper from '~/src/wrappers/TotoroApiWrapper';

const router = useRouter();
const {
  data: qrData,
  pending: qrPending,
  error: qrFetchError,
  refresh: refreshQr,
} = useFetch<{ uuid: string; imgUrl: string }>('/api/scanQr');
const message = ref('');
const actionLoading = ref(false);
const session = useSession();

// 随机诗句
const poems = [
  ['跑步不是目的', '自由才是'],
  ['身体是灵魂的殿堂', '运动是自由的钥匙'],
  ['每一次奔跑', '都是对规训的反抗'],
  ['健康不是数据', '而是选择'],
];
const randomPoem = poems[Math.floor(Math.random() * poems.length)];

const handleScanned = async () => {
  if (actionLoading.value) return;
  message.value = '';

  const uuid = qrData.value?.uuid;
  if (!uuid) {
    message.value = '二维码尚未准备完成，请稍后再试';
    return;
  }

  actionLoading.value = true;
  try {
    const scanRes = await $fetch(`/api/scanQr/${uuid}`);
    const code = (scanRes as { code: string; message: null } | { code: null; message: string })
      .code as string;

    const loginResult = (
      await Promise.all([TotoroApiWrapper.getLesseeServer(code), TotoroApiWrapper.getAppAd(code)])
    )[0];
    if (!loginResult.token) {
      message.value = loginResult.message as string;
      return;
    }

    // 获取额外信息
    const personalInfo = await TotoroApiWrapper.login({ token: loginResult.token });
    session.value = { ...personalInfo, token: loginResult.token, code, data: null };

    const breq = {
      token: loginResult.token,
      campusId: personalInfo.campusId,
      schoolId: personalInfo.schoolId,
      stuNumber: personalInfo.stuNumber,
    };

    await TotoroApiWrapper.getAppFrontPage(breq);
    await TotoroApiWrapper.getAppSlogan(breq);
    await TotoroApiWrapper.updateAppVersion(breq);
    await TotoroApiWrapper.getAppNotice(breq);
    router.push('/scanned');
  } catch (e) {
    console.error(e);
    message.value = '龙猫服务器错误';
  } finally {
    actionLoading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <!-- 引言卡片 -->
    <VCard class="quote-card mb-6">
      <VCardText class="quote-content">
        <VIcon icon="i-mdi-format-quote-open" class="quote-icon" />
        <p class="quote-text">
          古典时代的人发现人体是权力的对象和目标。……这种人体是被操纵、被塑造、被规训的。它服从，配合，变得灵巧、强壮。"人是机器"这部大书是在两个领域被同时撰写的。
        </p>
        <div class="quote-author">
          <span class="author-line"></span>
          <span>米歇尔·福柯《规训与惩罚》</span>
        </div>
      </VCardText>
    </VCard>

    <!-- 登录卡片 -->
    <VCard class="login-card">
      <VCardTitle class="login-title">
        <VIcon icon="i-mdi-qrcode-scan" class="mr-2" />
        微信扫码登录
      </VCardTitle>

      <VCardText>
        <p class="login-desc">
          请使用微信扫描下方二维码，扫码后点击「下一步」按钮继续
        </p>

        <VDivider class="my-4" />

        <div class="login-content">
          <!-- 二维码区域 -->
          <div class="qr-section">
            <div class="qr-wrapper" :class="{ 'loading': qrPending }">
              <!-- 加载中 -->
              <template v-if="qrPending">
                <div class="qr-loading">
                  <VProgressCircular
                    indeterminate
                    color="primary"
                    :size="48"
                    :width="3"
                  />
                  <span class="loading-text">正在生成二维码...</span>
                </div>
              </template>

              <!-- 二维码图片 -->
              <template v-else-if="qrData?.imgUrl">
                <img
                  :src="qrData.imgUrl"
                  alt="登录二维码"
                  class="qr-image"
                  referrerpolicy="no-referrer"
                />
                <div class="qr-overlay">
                  <VIcon icon="i-mdi-refresh" />
                  <span>已过期请刷新</span>
                </div>
              </template>

              <!-- 错误/空状态 -->
              <template v-else>
                <div class="qr-error">
                  <VIcon icon="i-mdi-alert-circle" size="48" color="error" />
                  <p class="error-text">{{ message || (qrFetchError ? '二维码获取失败' : '二维码不可用') }}</p>
                  <VBtn
                    variant="outlined"
                    color="primary"
                    prepend-icon="i-mdi-refresh"
                    @click="refreshQr()"
                  >
                    刷新二维码
                  </VBtn>
                </div>
              </template>
            </div>
          </div>

          <!-- 操作区域 -->
          <div class="action-section">
            <VAlert
              v-if="message"
              type="error"
              variant="tonal"
              closable
              class="mb-4"
            >
              {{ message }}
            </VAlert>

            <VBtn
              color="primary"
              size="large"
              block
              :loading="actionLoading"
              :disabled="qrPending || !qrData?.uuid"
              prepend-icon="i-mdi-arrow-right"
              @click="handleScanned"
              class="next-btn"
            >
              下一步
            </VBtn>

            <VBtn
              variant="text"
              color="secondary"
              block
              class="mt-2"
              :disabled="qrPending"
              prepend-icon="i-mdi-refresh"
              @click="refreshQr()"
            >
              刷新二维码
            </VBtn>

            <VDivider class="my-4" />

            <!-- 随机诗句 -->
            <div class="poem">
              <p v-for="(line, i) in randomPoem" :key="i">{{ line }}</p>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.login-page {
  max-width: 800px;
  margin: 0 auto;
  animation: fadeInUp 0.5s ease-out;
}

/* 引言卡片 */
.quote-card {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  color: white !important;
  border: none !important;
}

.quote-content {
  position: relative;
  padding: 32px !important;
}

.quote-icon {
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 64px;
  opacity: 0.2;
}

.quote-text {
  font-size: 1.1rem;
  line-height: 1.8;
  font-style: italic;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.quote-author {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.author-line {
  width: 30px;
  height: 1px;
  background: currentColor;
  opacity: 0.5;
}

/* 登录卡片 */
.login-card {
  overflow: hidden;
}

.login-title {
  font-size: 1.25rem;
  font-weight: 600;
  padding: 24px 24px 0 !important;
  color: var(--text-primary);
}

.login-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.login-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

/* 二维码区域 */
.qr-section {
  display: flex;
  justify-content: center;
}

.qr-wrapper {
  width: 240px;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.qr-wrapper.loading {
  border-style: dashed;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.qr-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 20px;
}

.error-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.qr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.qr-wrapper:hover .qr-overlay {
  opacity: 1;
  pointer-events: auto;
}

/* 操作区域 */
.action-section {
  display: flex;
  flex-direction: column;
}

.next-btn {
  font-size: 1rem;
  letter-spacing: 0.5px;
}

/* 诗句 */
.poem {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.8;
  font-style: italic;
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
}

.poem p {
  margin: 0;
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

/* 响应式 */
@media (max-width: 640px) {
  .login-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .qr-section {
    order: -1;
  }

  .quote-content {
    padding: 24px !important;
  }

  .quote-text {
    font-size: 1rem;
  }
}
</style>

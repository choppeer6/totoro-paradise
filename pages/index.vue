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
  <div class="max-w-2xl mx-auto px-4 py-8">
    <VCard class="mb-6">
      <VCardTitle class="text-h5">
        Totoro School
      </VCardTitle>
      <VCardText>
        <p class="text-subtitle-1">
          古典时代的人发现人体是权力的对象和目标。……这种人体是被操纵、被塑造、被规训的。它服从，配合，变得灵巧、强壮。“人是机器”这部大书是在两个领域被同时撰写的。
        </p>
        <p class="mt-2 text-end">—— 米歇尔·福柯《规训与惩罚》</p>
      </VCardText>
    </VCard>

    <VCard>
      <VCardTitle class="text-h6">
        请用微信扫码
      </VCardTitle>
      <VCardText>
        <p class="text-body-1 mb-4">
          扫码后点击“下一步”按钮
        </p>

        <div class="flex gap-6 flex-wrap items-start">
          <VCard :height="220" :width="220" class="flex items-center justify-center">
            <div v-if="qrPending" class="flex flex-col items-center gap-3">
              <VProgressCircular indeterminate color="primary" />
              <span class="text-sm text-grey">正在生成二维码...</span>
            </div>
            <img
              v-else-if="qrData?.imgUrl"
              :src="qrData.imgUrl"
              class="w-100"
              referrerpolicy="no-referrer"
            />
            <div v-else class="h-100 w-100 flex items-center justify-center px-3 text-center">
              {{ message || (qrFetchError ? '二维码获取失败，请刷新重试' : '二维码不可用') }}
              <div class="mt-3">
                <VBtn
                  variant="outlined"
                  size="small"
                  color="primary"
                  :loading="actionLoading"
                  @click="refreshQr()"
                >
                  刷新二维码
                </VBtn>
              </div>
            </div>
          </VCard>

          <div class="flex-1 min-w-240">
            <VAlert v-if="message" type="error" variant="tonal" class="mb-4">
              {{ message }}
            </VAlert>

            <VBtn
              color="primary"
              append-icon="i-mdi-arrow-right"
              :loading="actionLoading"
              :disabled="qrPending"
              @click="handleScanned"
            >
              下一步
            </VBtn>

            <VDivider class="my-4" />

            <div class="text-sm pre-wrap">
              {{ poem[Math.floor(Math.random() * poem.length)].join('\n') }}
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

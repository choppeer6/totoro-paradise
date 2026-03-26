<script setup lang="ts">
import TotoroApiWrapper from '~/src/wrappers/TotoroApiWrapper';
import generateRunReq from '~~/src/controllers/generateSunRunExercisesReq';
import generateRoute from '~~/src/utils/generateRoute';

const sunrunPaper = useSunRunPaper();
const session = useSession();
const selectValue = ref('');

const quickStatus = ref<'idle' | 'running' | 'done' | 'error'>('idle');
const quickMessage = ref('');

const data = await TotoroApiWrapper.getSunRunPaper({
  token: session.value.token,
  campusId: session.value.campusId,
  schoolId: session.value.schoolId,
  stuNumber: session.value.stuNumber,
});
watchEffect(() => {
  if (data) {
    sunrunPaper.value = data;
    // 默认选中第一条路线，避免用户首次进入页面需要手动选择
    if (!selectValue.value && data.runPointList?.length) {
      selectValue.value = data.runPointList[0].pointId;
    }
  }
});

const alreadyRun = computed(() => data?.ifHasRun === '1');

const handleRandomRoute = () => {
  const list = data?.runPointList;
  if (!list?.length) return;
  selectValue.value = list[Math.floor(Math.random() * list.length)].pointId;
};

const handleQuickRun = async () => {
  if (!data) return;
  // 如果当天已经有打卡记录，则直接退出，避免后续触发提交流程
  if (alreadyRun.value) {
    quickStatus.value = 'done';
    quickMessage.value = '今天已经打过卡了';
    return;
  }
  quickStatus.value = 'running';
  quickMessage.value = '正在打卡...';

  try {
    if (!data.runPointList?.length) {
      throw new Error('暂无可用路线，请稍后重试');
    }
    // 随机选路线
    const target = data.runPointList[Math.floor(Math.random() * data.runPointList.length)];

    const { req } = await generateRunReq({
      distance: data.mileage,
      routeId: target.pointId,
      taskId: target.taskId,
      token: session.value.token,
      schoolId: session.value.schoolId,
      stuNumber: session.value.stuNumber,
      phoneNumber: session.value.phoneNumber,
      minTime: data.minTime,
      maxTime: data.maxTime,
    });

    quickMessage.value = '通知服务器开跑...';
    await TotoroApiWrapper.getRunBegin({
      campusId: session.value.campusId,
      schoolId: session.value.schoolId,
      stuNumber: session.value.stuNumber,
      token: session.value.token,
    });

    // 等待模拟跑步时长
    const waitMs = Number(new Date(req.evaluateDate)) - Date.now();
    if (waitMs > 0) {
      const totalMin = Math.ceil(waitMs / 60000);
      quickMessage.value = `跑步中，预计 ${totalMin} 分钟...`;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    quickMessage.value = '提交跑步记录...';
    const res = await TotoroApiWrapper.sunRunExercises(req);

    quickMessage.value = '提交路线轨迹...';
    const runRoute = generateRoute(data.mileage, target);
    await TotoroApiWrapper.sunRunExercisesDetail({
      pointList: runRoute.mockRoute,
      scantronId: res.scantronId,
      breq: {
        campusId: session.value.campusId,
        schoolId: session.value.schoolId,
        stuNumber: session.value.stuNumber,
        token: session.value.token,
      },
    });

    quickStatus.value = 'done';
    quickMessage.value = '打卡成功！';
  } catch (e: any) {
    quickStatus.value = 'error';
    quickMessage.value = e?.message || '打卡失败';
  }
};

const handleUpdate = (target: string) => {
  selectValue.value = target;
};
</script>

<template>
  <VCard class="mb-6">
    <VCardTitle class="text-h6">
      请核对个人信息
    </VCardTitle>
    <VCardText>
      <VTable density="compact">
        <tbody>
          <tr>
            <td>学校</td>
            <td>{{ session.campusName }}</td>
          </tr>
          <tr>
            <td>学院</td>
            <td>{{ session.collegeName }}</td>
          </tr>
          <tr>
            <td>学号</td>
            <td>{{ session.stuNumber }}</td>
          </tr>
          <tr>
            <td>姓名</td>
            <td>{{ session.stuName }}</td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>

  <!-- 一键打卡 + 手动选择路线 -->
  <template v-if="data">
    <VCard class="mb-6">
      <VCardTitle class="text-h6">
        一键打卡
      </VCardTitle>
      <VCardText>
        <div v-if="alreadyRun">
          <VAlert type="success" variant="tonal">
            今天已经打过卡了
          </VAlert>
        </div>
        <div v-else>
          <VBtn
            color="primary"
            size="large"
            :loading="quickStatus === 'running'"
            :disabled="quickStatus === 'running' || quickStatus === 'done'"
            append-icon="mdi-lightning-bolt"
            @click="handleQuickRun"
          >
            一键打卡
          </VBtn>
          <VAlert v-if="quickStatus === 'done'" type="success" variant="tonal" class="mt-3">
            {{ quickMessage }}
          </VAlert>
          <VAlert v-if="quickStatus === 'error'" type="error" variant="tonal" class="mt-3">
            {{ quickMessage }}
          </VAlert>
          <p v-if="quickStatus === 'running'" class="text-body-2 text-grey mt-2">
            {{ quickMessage }}
          </p>
        </div>
      </VCardText>
    </VCard>

    <VCard class="mb-6">
      <VCardTitle class="text-h6">
        选择路线
      </VCardTitle>
      <VCardText>
        <p class="text-body-2 text-grey mb-2">
          或手动选择路线
        </p>
        <VSelect
          v-model="selectValue"
          :items="data.runPointList"
          item-title="pointName"
          item-value="pointId"
          variant="underlined"
          label="路线"
          class="mt-2"
        />

        <div class="d-flex mt-3 gap-4" style="flex-wrap: wrap; align-items: center">
          <VBtn
            variant="outlined"
            color="primary"
            append-icon="i-mdi-gesture"
            @click="handleRandomRoute"
          >
            随机路线
          </VBtn>

          <NuxtLink v-if="selectValue" :to="`/run/${encodeURIComponent(selectValue)}`">
            <VBtn color="primary" append-icon="i-mdi-arrow-right">
              开始跑步
            </VBtn>
          </NuxtLink>
          <VBtn v-else color="primary" append-icon="i-mdi-arrow-right" disabled>
            开始跑步
          </VBtn>

          <VBtn
            color="secondary"
            append-icon="i-mdi-calendar-multiple"
            disabled
            title="批量提交暂不可用"
          >
            批量打卡（暂不可用）
          </VBtn>
        </div>

        <VAlert type="info" variant="tonal" class="mt-3">
          批量提交暂不可用
        </VAlert>
        <p class="mb-2 mt-6 text-xs">
          地图中的路线仅为展示路线生成效果，不等于最终路线
        </p>
      </VCardText>
    </VCard>

    <VCard>
      <VCardTitle class="text-h6">
        路线地图
      </VCardTitle>
      <VCardText>
        <div class="h-50vh w-50vw">
          <ClientOnly>
            <AMap :target="selectValue" @update:target="handleUpdate" />
          </ClientOnly>
        </div>
      </VCardText>
    </VCard>
  </template>
</template>

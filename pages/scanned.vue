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
  }
});

const alreadyRun = computed(() => data?.ifHasRun === '1');

const handleQuickRun = async () => {
  if (!data) return;
  quickStatus.value = 'running';
  quickMessage.value = '正在打卡...';

  try {
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
  <p>请核对个人信息</p>
  <VTable density="compact" class="mb-6 mt-4">
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

  <!-- 一键打卡 -->
  <template v-if="data">
    <div v-if="alreadyRun" class="mb-6">
      <VAlert type="success" variant="tonal"> 今天已经打过卡了 </VAlert>
    </div>
    <div v-else class="mb-6">
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
      <p v-if="quickStatus === 'running'" class="mt-2 text-body-2 text-grey">
        {{ quickMessage }}
      </p>
    </div>

    <VDivider class="mb-4" />

    <!-- 原有手动模式 -->
    <p class="text-body-2 text-grey mb-2">或手动选择路线</p>
    <VSelect
      v-model="selectValue"
      :items="data.runPointList"
      item-title="pointName"
      item-value="pointId"
      variant="underlined"
      label="路线"
      class="mt-2"
    />
    <div class="flex gap-4">
      <VBtn
        variant="outlined"
        color="primary"
        append-icon="i-mdi-gesture"
        @click="
          selectValue =
            data!.runPointList[Math.floor(Math.random() * data!.runPointList.length)].pointId
        "
      >
        随机路线
      </VBtn>
      <NuxtLink v-if="selectValue" :to="`/run/${encodeURIComponent(selectValue)}`">
        <VBtn class="ml-auto" color="primary" append-icon="i-mdi-arrow-right"> 开始跑步 </VBtn>
      </NuxtLink>
      <VBtn v-else class="ml-auto" color="primary" append-icon="i-mdi-arrow-right" disabled>
        开始跑步
      </VBtn>
      <NuxtLink to="/batch">
        <VBtn color="secondary" append-icon="i-mdi-calendar-multiple"> 批量打卡 </VBtn>
      </NuxtLink>
    </div>
    <p class="mb-2 mt-6 text-xs">地图中的路线仅为展示路线生成效果，不等于最终路线</p>
    <div class="h-50vh w-50vw">
      <ClientOnly>
        <AMap :target="selectValue" @update:target="handleUpdate" />
      </ClientOnly>
    </div>
  </template>
</template>

<script setup lang="ts">
import { eachDayOfInterval, format } from 'date-fns';
import TotoroApiWrapper from '~/src/wrappers/TotoroApiWrapper';
import generateRunReq from '~~/src/controllers/generateSunRunExercisesReq';
import generateRoute from '~~/src/utils/generateRoute';

const sunRunPaper = useSunRunPaper();
const session = useSession();
const selectedRoute = ref('');
const startDate = ref('');
const endDate = ref('');
const batchRunning = ref(false);

interface DateStatus {
  date: string;
  status: 'pending' | 'running' | 'done' | 'error';
  message?: string;
}

const dateStatuses = ref<DateStatus[]>([]);

const canStart = computed(
  () => selectedRoute.value && startDate.value && endDate.value && !batchRunning.value,
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const handleBatchRun = async () => {
  const dates = eachDayOfInterval({
    start: new Date(startDate.value),
    end: new Date(endDate.value),
  });

  dateStatuses.value = dates.map((d) => ({
    date: format(d, 'yyyy-MM-dd'),
    status: 'pending' as const,
  }));

  batchRunning.value = true;
  const target = sunRunPaper.value.runPointList.find((r) => r.pointId === selectedRoute.value)!;

  for (let i = 0; i < dates.length; i++) {
    dateStatuses.value[i].status = 'running';
    try {
      const { req } = await generateRunReq({
        distance: sunRunPaper.value.mileage,
        routeId: target.pointId,
        taskId: target.taskId,
        token: session.value.token,
        schoolId: session.value.schoolId,
        stuNumber: session.value.stuNumber,
        phoneNumber: session.value.phoneNumber,
        minTime: sunRunPaper.value.minTime,
        maxTime: sunRunPaper.value.maxTime,
        targetDate: dates[i],
      });

      await TotoroApiWrapper.getRunBegin({
        campusId: session.value.campusId,
        schoolId: session.value.schoolId,
        stuNumber: session.value.stuNumber,
        token: session.value.token,
      });

      // 短暂延迟模拟间隔，不需要等真实跑步时长
      await sleep(2000 + Math.random() * 3000);

      const res = await TotoroApiWrapper.sunRunExercises(req);
      const runRoute = generateRoute(sunRunPaper.value.mileage, target);

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

      dateStatuses.value[i].status = 'done';
    } catch (e: any) {
      dateStatuses.value[i].status = 'error';
      dateStatuses.value[i].message = e?.message || '请求失败';
    }

    // 每天之间随机延迟，避免风控
    if (i < dates.length - 1) {
      await sleep(3000 + Math.random() * 5000);
    }
  }

  batchRunning.value = false;
};

function statusIcon(status: string) {
  switch (status) {
    case 'pending':
      return 'mdi-clock-outline';
    case 'running':
      return 'mdi-run';
    case 'done':
      return 'mdi-check-circle';
    case 'error':
      return 'mdi-alert-circle';
    default:
      return '';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'grey';
    case 'running':
      return 'blue';
    case 'done':
      return 'green';
    case 'error':
      return 'red';
    default:
      return '';
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (batchRunning.value) {
    e.preventDefault();
    e.returnValue = '批量跑步进行中，确定要离开吗？';
  }
}
</script>

<template>
  <p class="text-h6 mb-4">批量打卡</p>

  <VSelect
    v-model="selectedRoute"
    :items="sunRunPaper.runPointList"
    item-title="pointName"
    item-value="pointId"
    variant="underlined"
    label="路线"
    class="mb-2"
  />

  <div class="d-flex gap-4 mb-4">
    <VTextField v-model="startDate" type="date" label="开始日期" variant="underlined" />
    <VTextField v-model="endDate" type="date" label="结束日期" variant="underlined" />
  </div>

  <VBtn :disabled="!canStart" :loading="batchRunning" color="primary" @click="handleBatchRun">
    开始批量打卡
  </VBtn>

  <VList v-if="dateStatuses.length" class="mt-4">
    <VListItem v-for="item in dateStatuses" :key="item.date">
      <template #prepend>
        <VIcon :icon="statusIcon(item.status)" :color="statusColor(item.status)" />
      </template>
      <VListItemTitle>{{ item.date }}</VListItemTitle>
      <VListItemSubtitle v-if="item.message" class="text-red">
        {{ item.message }}
      </VListItemSubtitle>
    </VListItem>
  </VList>
</template>

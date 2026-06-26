<script setup lang="ts">
const { runningJobs, completedJobs, init } = useJobs()

init()

function statusColor(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  return 'info'
}

function removeJob(id: string) {
  const { jobs } = useJobs()
  const next: Record<string, Job> = {}
  for (const [key, value] of Object.entries(jobs.value)) {
    if (key !== id) next[key] = value
  }
  jobs.value = next
  saveJobs()
}

function saveJobs() {
  const { jobs } = useJobs()
  const runningIds = Object.values(jobs.value)
    .filter(j => j.status === 'pending' || j.status === 'running')
    .map(j => j.id)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('clarity-running-jobs', JSON.stringify(runningIds))
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
    <UCard
      v-for="job in runningJobs"
      :key="job.id"
      class="shadow-xl border-primary/30"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-loader-2"
              class="size-4 animate-spin text-primary"
            />
            <span class="font-medium text-sm">Running import</span>
          </div>
          <UBadge
            :label="job.status"
            variant="subtle"
            color="primary"
            size="xs"
          />
        </div>
      </template>

      <div class="text-xs text-muted font-mono mb-2">
        {{ job.id }}
      </div>

      <div class="max-h-32 overflow-y-auto text-xs space-y-1 font-mono bg-elevated/50 p-2 rounded">
        <div
          v-for="(log, idx) in job.logs"
          :key="idx"
        >
          {{ log }}
        </div>
      </div>
    </UCard>

    <UCard
      v-for="job in completedJobs"
      :key="job.id"
      class="shadow-xl"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              :name="job.status === 'completed' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              class="size-4"
              :class="job.status === 'completed' ? 'text-success' : 'text-error'"
            />
            <span class="font-medium text-sm">Import {{ job.status }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UBadge
              :label="job.status"
              variant="subtle"
              :color="statusColor(job.status)"
              size="xs"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="ghost"
              @click="removeJob(job.id)"
            />
          </div>
        </div>
      </template>

      <div
        v-if="job.error"
        class="text-xs text-error mb-2"
      >
        {{ job.error }}
      </div>

      <pre
        v-if="job.result"
        class="text-xs font-mono overflow-auto max-h-32"
      >{{ JSON.stringify(job.result, null, 2) }}</pre>
    </UCard>
  </div>
</template>

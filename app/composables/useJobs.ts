export interface Job {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result: Record<string, unknown> | null
  error: string | null
  logs: string[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'clarity-running-jobs'

export function useJobs() {
  const jobs = useState<Record<string, Job>>('jobs', () => ({}))
  const intervals = new Map<string, ReturnType<typeof setInterval>>()

  function loadStoredJobs() {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const ids = JSON.parse(stored) as string[]
        for (const id of ids) {
          if (!jobs.value[id]) {
            jobs.value[id] = {
              id,
              type: 'import',
              status: 'running',
              result: null,
              error: null,
              logs: [],
              createdAt: '',
              updatedAt: ''
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  function saveStoredJobs() {
    if (typeof window === 'undefined') return
    const runningIds = Object.values(jobs.value)
      .filter(j => j.status === 'pending' || j.status === 'running')
      .map(j => j.id)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runningIds))
  }

  async function fetchJob(id: string) {
    try {
      const data = await $fetch<Job>(`/api/jobs/${id}`)
      jobs.value[id] = data
      return data
    } catch {
      return null
    }
  }

  function startPolling(id: string) {
    if (intervals.has(id)) return

    fetchJob(id)

    const interval = setInterval(async () => {
      const job = await fetchJob(id)
      if (!job || job.status === 'completed' || job.status === 'failed') {
        clearInterval(interval)
        intervals.delete(id)
        saveStoredJobs()
      }
    }, 2000)

    intervals.set(id, interval)
  }

  function trackJob(id: string) {
    loadStoredJobs()
    startPolling(id)
    saveStoredJobs()
  }

  function init() {
    loadStoredJobs()
    for (const id of Object.keys(jobs.value)) {
      startPolling(id)
    }
  }

  const runningJobs = computed(() =>
    Object.values(jobs.value).filter(j => j.status === 'pending' || j.status === 'running')
  )

  const completedJobs = computed(() =>
    Object.values(jobs.value).filter(j => j.status === 'completed' || j.status === 'failed')
  )

  return {
    jobs,
    runningJobs,
    completedJobs,
    trackJob,
    init
  }
}

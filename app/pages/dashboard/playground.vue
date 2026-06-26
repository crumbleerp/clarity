<script setup lang="ts">
import { json } from '@codemirror/lang-json'
import { keymap } from '@codemirror/view'
import { Codemirror } from 'vue-codemirror'
import { JsonViewer } from '@anilkumarthakur/vue3-json-viewer'
import type { JsonValue } from '@anilkumarthakur/vue3-json-viewer'
import '@anilkumarthakur/vue3-json-viewer/styles.css'
import { groq } from '~/utils/groqLanguage'
import { parse as parseGroq } from 'groq-js'

interface HistoryItem {
  id: string
  query: string
  params: string
  dataset: string
  date: string
}

const STORAGE_KEY = 'clarity-playground-history'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const colorMode = useColorMode()

const dataset = ref<string>((route.query.dataset as string) || runtimeConfig.public.dataset || 'production')
const query = ref<string>(`*[_type == "post"] | order(_createdAt desc) {
  _id,
  title,
  slug
}[0...10]`)
const params = ref<string>('{}')
const executing = ref(false)
const result = shallowRef<JsonValue | null>(null)
const error = ref<string | null>(null)
const responseTime = ref<number | null>(null)
const isDark = computed(() => colorMode.value === 'dark')

const history = useClarityLocalStorage<HistoryItem[]>(STORAGE_KEY, [])

const historyList = computed(() =>
  [...history.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
)

const queryExtensions = computed(() => [
  groq(),
  keymap.of([
    {
      key: 'Ctrl-Enter',
      run: () => {
        execute()
        return true
      }
    },
    {
      key: 'Cmd-Enter',
      run: () => {
        execute()
        return true
      }
    }
  ])
])

function apiBaseUrl(): string {
  return (runtimeConfig.public.apiBaseUrl || '').replace(/\/$/, '')
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function paramsObject(): Record<string, unknown> | null {
  const raw = params.value.trim()
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function execute() {
  const queryString = query.value.trim()
  if (!queryString) return

  const parsedParams = paramsObject()
  if (parsedParams === null) {
    error.value = 'Invalid params JSON'
    return
  }

  try {
    parseGroq(queryString, { params: parsedParams })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    result.value = null
    return
  }

  executing.value = true
  error.value = null
  const start = performance.now()

  try {
    const qs = new URLSearchParams({ query: queryString })
    if (parsedParams && Object.keys(parsedParams).length > 0) {
      qs.set('params', JSON.stringify(parsedParams))
    }

    const res = await fetch(`${apiBaseUrl()}/v1/data/query/${encodeURIComponent(dataset.value)}?${qs.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    responseTime.value = Math.round(performance.now() - start)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || res.statusText)
    }

    const data = await res.json()
    result.value = data.result

    saveHistory(queryString, parsedParams || {})
  } catch (err) {
    result.value = null
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    executing.value = false
  }
}

function saveHistory(currentQuery: string, currentParams: Record<string, unknown>) {
  const paramsString = JSON.stringify(currentParams)
  const item: HistoryItem = {
    id: generateId(),
    query: currentQuery,
    params: paramsString,
    dataset: dataset.value,
    date: new Date().toISOString()
  }

  history.value = [item, ...history.value.filter((h: HistoryItem) => h.query !== currentQuery || h.params !== paramsString)].slice(0, 10)
}

function loadHistory(item: HistoryItem) {
  query.value = item.query
  params.value = item.params
  dataset.value = item.dataset
  result.value = null
  error.value = null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleTimeString()
}

function clearHistory() {
  history.value = []
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-64px)]">
    <div class="flex flex-1 overflow-hidden">
      <div class="w-1/3 min-w-[320px] flex flex-col border-r border-default overflow-hidden">
        <div class="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
          <label class="text-xs font-semibold text-default-foreground/70 uppercase">Query</label>
          <div class="flex-1 min-h-0 rounded border border-default overflow-hidden">
            <Codemirror
              v-model="query"
              :extensions="queryExtensions"
              :style="{ height: '100%', width: '100%' }"
            />
          </div>
        </div>

        <div class="h-36 p-3 border-t border-default flex flex-col gap-2 overflow-hidden">
          <label class="text-xs font-semibold text-default-foreground/70 uppercase">Params</label>
          <div class="flex-1 min-h-0 rounded border border-default overflow-hidden">
            <Codemirror
              v-model="params"
              :extensions="[json()]"
              :style="{ height: '100%', width: '100%' }"
            />
          </div>
        </div>
        <div class="h-fit p-3 border-t border-default flex items-center justify-between gap-2">
          <span

            class="text-xs text-default-foreground/60"
          >{{ responseTime ?? '-' }}ms</span>
          <UButton
            :loading="executing"
            color="secondary"
            icon="i-lucide-play"
            size="sm"
            @click="execute"
          >
            <span class="text-nowrap">Fetch query</span>
          </UButton>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-w-0 border-r border-default">
        <div class="flex items-center justify-between p-2 border-b border-default bg-default/30">
          <span class="text-xs font-semibold uppercase">Result</span>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <div
            v-if="error"
            class="p-3 rounded bg-red-500/10 text-red-500 text-sm font-mono whitespace-pre-wrap"
          >
            {{ error }}
          </div>
          <div
            v-else-if="result === null"
            class="text-sm text-default-foreground/50"
          >
            Run a query to see results
          </div>
          <JsonViewer
            v-else
            :data="result"
            :dark-mode="isDark"
            :expanded="true"
          />
        </div>
      </div>

      <div class="w-64 flex flex-col border-l border-default bg-default/30">
        <div class="flex items-center justify-between p-3 border-b border-default">
          <span class="text-xs font-semibold uppercase">History</span>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="clearHistory"
          >
            Clear
          </UButton>
        </div>
        <div class="flex-1 overflow-auto p-2 space-y-2">
          <button
            v-for="item in historyList"
            :key="item.id"
            class="w-full text-left p-2 rounded-lg bg-default/50 hover:bg-default/80 transition-colors"
            @click="loadHistory(item)"
          >
            <div class="text-xs font-mono truncate">
              {{ item.query }}
            </div>
            <div class="text-[10px] text-default-foreground/50 mt-1">
              {{ formatDate(item.date) }}
            </div>
          </button>
          <div
            v-if="historyList.length === 0"
            class="text-xs text-default-foreground/50 p-2"
          >
            No recent queries
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  background-color: var(--ui-bg);
  height: 100%;
  :deep(.ͼe) {
    color: var(--color-yellow-100)
  }
  :deep(.ͼd) {
    color: var(--color-green-100)
  }
  :deep(.ͼc) {
    color: #569cd6;
  }
}

:deep(.cm-content) {
  color: var(--ui-text);
}

:deep(.cm-gutters) {
  background-color: var(--ui-bg-elevated) !important;
  border-right-color: var(--ui-border) !important;
}

:deep(.cm-activeLineGutter) {
  background-color: var(--ui-bg-elevated) !important;
}

:deep(.jv-node) {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0px !important;
}

:deep(.jv-control-btn) {
  background: var(--ui-secondary) !important;
  border: none !important;
  color: var(--ui-text-inverted) !important;
  font-family: "Google Sans" !important;
  padding: 2px 8px !important;
}
</style>

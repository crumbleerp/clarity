<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()
const { canSeeSettings, canCreateDatasets } = usePermissions()
const currentDataset = useCurrentDataset()

const items = computed<NavigationMenuItem[]>(() => {
  const list: NavigationMenuItem[] = [
    { label: 'Documents', icon: 'i-lucide-file-text', to: '/dashboard/documents' },
    { label: 'Media', icon: 'i-lucide-image', to: '/dashboard/media' },
    { label: 'Playground', icon: 'i-lucide-terminal', to: '/dashboard/playground' }
  ]
  if (canSeeSettings.value) {
    list.push({ label: 'Settings', icon: 'i-lucide-settings', to: '/dashboard/settings' })
  }
  return list
})
</script>

<template>
  <div>
    <UHeader
      class="border-b border-default"
      :toggle="false"
      :ui="{ container: 'min-w-full px-4!' }"
    >
      <template #left>
        <img
          src="~/assets/svg/logo.svg"
          class="h-6 mr-6"
        >
        <UNavigationMenu
          :items="items"
          variant="pill"
          color="secondary"
          orientation="horizontal"
        />
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <DatasetSelector
            v-model="currentDataset"
            :allow-create="canCreateDatasets"
          />
          <UAvatar
            :alt="user?.username"
            size="sm"
          />
          <span class="text-sm hidden sm:block">{{ user?.username }}</span>
          <UButton
            icon="i-lucide-log-out"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="logout"
          />
        </div>
      </template>
    </UHeader>

    <main class="min-h-[calc(100vh-64px)]">
      <slot />
    </main>

    <JobNotifications />
    <CommandPalette />
  </div>
</template>

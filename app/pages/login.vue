<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: false })

const { login, loading } = useAuth()
const toast = useToast()

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ username: '', password: '' })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const ok = await login(event.data.username, event.data.password)
  if (ok) {
    await navigateTo('/dashboard/documents')
  } else {
    toast.add({ title: 'Invalid credentials', description: 'Please check your username and password', color: 'error' })
  }
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden">
    <BackgroundGlow class="absolute w-full h-full -z-10" />
    <img
      src="~/assets/svg/made_by.svg"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 h-8"
    >
    <UCard
      class="relative z-10 w-full max-w-md mx-4 shadow-2xl"
      :ui="{ body: 'p-6!' }"
    >
      <template #header>
        <div class="flex flex-col">
          <img
            src="~/assets/svg/logo.svg"
            class="h-12"
          >
          <div class="text-center">
            <p class="text-sm text-muted mt-1">
              GROQ-powered self-hosted CMS
            </p>
          </div>
        </div>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Username"
          name="username"
        >
          <UInput
            v-model="state.username"
            placeholder="Enter your username"
            icon="i-lucide-user"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="Enter your password"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          :loading="loading"
          label="Sign in"
          size="lg"
          block
        />
      </UForm>
    </UCard>
  </div>
</template>

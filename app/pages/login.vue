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
    <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary.DEFAULT/10%),transparent_40%)]" />

    <UCard class="relative z-10 w-full max-w-md mx-4 shadow-2xl">
      <template #header>
        <div class="flex flex-col items-center gap-4 py-4">
          <div class="flex items-center justify-center size-16 rounded-2xl text-primary">
            <img
              src="~/assets/svg/logo.svg"
              class="h-12"
            >
          </div>
          <div class="text-center">
            <h1 class="text-2xl font-bold font-unbounded">
              Clarity
            </h1>
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

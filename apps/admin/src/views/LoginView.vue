<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/')
  } catch {
    error.value = 'Identifiants incorrects'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="mx-auto size-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
          GSG
        </div>
        <h1 class="mt-4 text-xl font-semibold text-slate-900">GSGLOGISTIQUE</h1>
        <p class="text-sm text-slate-500">Espace administration</p>
      </div>

      <form class="card p-6 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" required autocomplete="username" class="input" />
        </div>
        <div>
          <label class="label">Mot de passe</label>
          <input v-model="password" type="password" required autocomplete="current-password" class="input" />
        </div>
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

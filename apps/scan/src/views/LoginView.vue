<script setup lang="ts">
import { ref } from 'vue'
import { isAxiosError } from 'axios'
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
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: unknown) {
    error.value = isAxiosError(err) && err.response?.status === 401 ? 'Identifiants incorrects' : 'Connexion indisponible. Vérifiez votre connexion et réessayez.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="scan-page scan-login flex flex-col justify-between gap-10">
    <header class="scan-header flex items-center justify-between"><div class="flex items-center gap-3"><span class="brand-mark size-10 flex items-center justify-center font-extrabold text-sm">GSG</span><div><p class="text-sm font-semibold text-white">GSG Scan</p><p class="eyebrow !text-[8px] mt-1">Global Shipping Group</p></div></div><span class="agent-chip">Espace agents</span></header>
    <main class="login-main"><div class="login-intro mb-8"><div class="login-icon mb-7 flex items-center justify-center"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h3v3H7zm7 0h3v3h-3zM7 14h3v3H7zm7 0h3v3h-3z" /></svg></div><p class="eyebrow mb-3">Au plus près des opérations</p><h1 class="scan-heading">Un scan.<br /><span>La bonne action.</span></h1><p class="text-sm text-[#a7bfc7] mt-4 leading-relaxed max-w-xs">Identifiez un colis et accompagnez-le jusqu’à sa destination.</p></div>
      <form class="space-y-5" @submit.prevent="onSubmit"><div><label for="email" class="scan-label">Adresse email professionnelle</label><input id="email" v-model="email" type="email" placeholder="vous@gsglogistique.com" autocomplete="username" required class="scan-input" /></div><div><label for="password" class="scan-label">Mot de passe</label><input id="password" v-model="password" type="password" placeholder="Votre mot de passe" autocomplete="current-password" required class="scan-input" /></div><p v-if="error" role="alert" class="text-sm text-red-200 bg-red-950/30 border border-red-400/20 p-3 rounded-xl">{{ error }}</p><button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Connexion en cours…' : 'Accéder au scanner' }}<span v-if="!loading" aria-hidden="true">→</span></button></form>
    </main>
    <footer class="scan-footer border-t pt-5 flex justify-between text-[10px] text-[#92b1ba]"><span>USA ↔ Burkina Faso</span><span>GSG Logistique · Espace sécurisé</span></footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import { formatMoney } from '../../lib/format.js'
import Modal from '../../components/ui/Modal.vue'
import { COUNTRY_OPTIONS, countryLabel } from '../../lib/countries.js'

const { success, error: toastError } = useToast()

const items = ref<any[]>([])
const showCreate = ref(false)
const form = reactive({ code: '', label: '', country: 'US', currency: 'USD' })
const submitting = ref(false)

async function load() {
  const res = await api.get('/cash/accounts')
  items.value = res.data
}

async function createAccount() {
  submitting.value = true
  try {
    await api.post('/cash/accounts', form)
    success('Compte créé')
    showCreate.value = false
    Object.assign(form, { code: '', label: '', country: 'US', currency: 'USD' })
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="page-intro">
      <div><p class="eyebrow mb-2">Finance</p><h1 class="page-title">Comptes de caisse</h1><p class="page-description">Une vue claire sur les comptes et les soldes de votre activité.</p></div>
      <button class="btn-primary" @click="showCreate = true">
        <Icon icon="ph:plus-bold" class="size-4" />
        Nouveau compte
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="acc in items" :key="acc.id" class="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div class="flex items-center justify-between mb-3">
          <div class="size-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Icon icon="ph:wallet-bold" class="size-5 text-brand-600" />
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-ink-50 text-ink-600">{{ acc.currency }}</span>
        </div>
        <p class="font-medium text-ink-800">{{ acc.label }}</p>
        <p class="text-xs text-ink-500 mb-3 font-mono">{{ acc.code }} · {{ countryLabel(acc.country) }}</p>
        <p class="text-2xl font-display font-extrabold text-ink-900 tabular-nums">{{ formatMoney(acc.balance, acc.currency) }}</p>
      </div>
    </div>

    <Modal v-if="showCreate" title="Nouveau compte de caisse" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Code</label>
          <input v-model="form.code" class="input" placeholder="ex: ACC-USA-002" />
        </div>
        <div>
          <label class="label">Libellé</label>
          <input v-model="form.label" class="input" placeholder="ex: Caisse secondaire USA" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Pays</label>
            <select v-model="form.country" class="input">
              <option v-for="[code, label] in COUNTRY_OPTIONS" :key="code" :value="code">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Devise</label>
            <select v-model="form.currency" class="input">
              <option value="USD">USD</option>
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createAccount">
          {{ submitting ? 'Création...' : 'Créer' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

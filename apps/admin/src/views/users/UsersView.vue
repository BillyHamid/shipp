<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import Modal from '../../components/ui/Modal.vue'

const { success, error: toastError } = useToast()

const ROLES = [
  ['admin_global', 'Administrateur global'],
  ['agent_usa', 'Agent USA'],
  ['agent_bf', 'Agent Burkina Faso'],
  ['caissier', 'Caissier'],
  ['manutentionnaire', 'Manutentionnaire'],
]

const items = ref<any[]>([])
const showCreate = ref(false)
const form = reactive({ email: '', fullName: '', role: 'agent_usa', country: '', password: '' })
const submitting = ref(false)

async function load() {
  const res = await api.get('/users')
  items.value = res.data
}

async function toggleActive(user: any) {
  try {
    await api.post(`/users/${user.id}/${user.active ? 'deactivate' : 'activate'}`)
    success(user.active ? 'Utilisateur désactivé' : 'Utilisateur réactivé')
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

async function createUser() {
  submitting.value = true
  try {
    await api.post('/users', form)
    success('Utilisateur créé')
    showCreate.value = false
    Object.assign(form, { email: '', fullName: '', role: 'agent_usa', country: '', password: '' })
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
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Utilisateurs</h1>
      <button class="btn-primary" @click="showCreate = true">+ Nouvel utilisateur</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Nom</th>
            <th class="table-header">Email</th>
            <th class="table-header">Rôle</th>
            <th class="table-header">Pays</th>
            <th class="table-header">Statut</th>
            <th class="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="6" class="table-cell text-center text-slate-400 py-8">Aucun utilisateur</td>
          </tr>
          <tr v-for="u in items" :key="u.id" class="hover:bg-slate-50">
            <td class="table-cell font-medium">{{ u.fullName }}</td>
            <td class="table-cell">{{ u.email }}</td>
            <td class="table-cell">{{ u.role.label }}</td>
            <td class="table-cell">{{ u.country ?? '—' }}</td>
            <td class="table-cell">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                {{ u.active ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="table-cell">
              <button class="text-sm hover:underline" :class="u.active ? 'text-red-600' : 'text-emerald-600'" @click="toggleActive(u)">
                {{ u.active ? 'Désactiver' : 'Réactiver' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="showCreate" title="Nouvel utilisateur" @close="showCreate = false">
      <div class="space-y-4">
        <div>
          <label class="label">Nom complet</label>
          <input v-model="form.fullName" class="input" />
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="form.email" type="email" class="input" />
        </div>
        <div>
          <label class="label">Rôle</label>
          <select v-model="form.role" class="input">
            <option v-for="[value, label] in ROLES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Pays (optionnel)</label>
          <input v-model="form.country" class="input" placeholder="US ou BF" />
        </div>
        <div>
          <label class="label">Mot de passe temporaire</label>
          <input v-model="form.password" type="password" class="input" minlength="10" />
        </div>
        <button class="btn-primary w-full" :disabled="submitting" @click="createUser">
          {{ submitting ? 'Création...' : 'Créer' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

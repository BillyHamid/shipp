<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../../lib/api.js'
import { useToast } from '../../composables/useToast.js'
import StateBadge from '../../components/ui/StateBadge.vue'

const props = defineProps<{ id: string }>()
const { success, error: toastError } = useToast()

const box = ref<any>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  const res = await api.get(`/boxes/${props.id}`)
  box.value = res.data
  loading.value = false
}

async function dispatch() {
  try {
    await api.post(`/boxes/${props.id}/dispatch`)
    success('BOX expédiée — colis mis à jour')
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

async function markArrived() {
  try {
    await api.post(`/boxes/${props.id}/arrive`)
    success('BOX arrivée — colis mis à jour')
    await load()
  } catch (e: any) {
    toastError(e.response?.data?.message ?? 'Erreur')
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="text-center text-slate-400 py-12">Chargement...</div>

  <div v-else-if="box" class="space-y-6">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-slate-400">Référence BOX</p>
        <h1 class="text-2xl font-mono font-bold text-slate-900">{{ box.reference }}</h1>
      </div>
      <StateBadge :state="box.status" />
    </div>

    <div class="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
      <div>
        <p class="label">Type</p>
        <p class="text-slate-800">{{ box.type }}</p>
      </div>
      <div>
        <p class="label">Capacité</p>
        <p class="text-slate-800">{{ box.capacityKg }} kg</p>
      </div>
      <div>
        <p class="label">Trajet</p>
        <p class="text-slate-800">{{ box.originCountry }} → {{ box.destCountry }}</p>
      </div>
      <div>
        <p class="label">Colis</p>
        <p class="text-slate-800">{{ box.parcels?.length ?? 0 }}</p>
      </div>
    </div>

    <div class="flex gap-3">
      <button v-if="box.status === 'open'" class="btn-primary" @click="dispatch">✈️ Expédier la BOX</button>
      <button v-if="box.status === 'shipped' || box.status === 'in_transit'" class="btn-primary" @click="markArrived">
        🛬 Marquer arrivée
      </button>
    </div>

    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 font-medium text-slate-700">Colis dans cette BOX</div>
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">Réf. colis</th>
            <th class="table-header">Destinataire</th>
            <th class="table-header">Poids</th>
            <th class="table-header">État</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!box.parcels?.length">
            <td colspan="4" class="table-cell text-center text-slate-400 py-6">Aucun colis dans cette BOX</td>
          </tr>
          <tr
            v-for="p in box.parcels"
            :key="p.id"
            class="hover:bg-slate-50 cursor-pointer"
            @click="$router.push({ name: 'parcel-detail', params: { id: p.id } })"
          >
            <td class="table-cell font-mono">{{ p.trackingNumber }}</td>
            <td class="table-cell">{{ p.recipient.fullName }}</td>
            <td class="table-cell">{{ p.weightKg }} kg</td>
            <td class="table-cell"><StateBadge :state="p.currentState" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

import { defineStore } from 'pinia'
import { api } from '../lib/api.js'

export interface ScannedParcel {
  id: string
  trackingNumber: string
  currentState: string
  paymentState: string
  category: string
  weightKg: number
  originCountry: string
  destCountry: string
  sender: { fullName: string }
  recipient: { fullName: string; phone: string }
  box: { reference: string } | null
}

interface ScanState {
  parcel: ScannedParcel | null
  allowedActions: string[]
  loading: boolean
  error: string | null
}

export const useScanStore = defineStore('scan', {
  state: (): ScanState => ({
    parcel: null,
    allowedActions: [],
    loading: false,
    error: null,
  }),

  actions: {
    async lookupByQrUrl(qrUrl: string) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post('/scan', { qrUrl })
        this.parcel = res.data.parcel
        this.allowedActions = res.data.allowedActions
      } catch (e: unknown) {
        this.error = this.extractMessage(e)
        this.parcel = null
      } finally {
        this.loading = false
      }
    },

    async transition(
      action: string,
      metadata: Record<string, unknown> = {},
    ): Promise<{ success: boolean; message?: string }> {
      if (!this.parcel) return { success: false, message: 'No parcel loaded' }
      try {
        const res = await api.post(`/parcels/${this.parcel.id}/transitions`, {
          action,
          metadata: { ...metadata, scanned: true },
        })
        this.parcel = { ...this.parcel, currentState: res.data.currentState }
        // Actions valid a moment ago may no longer be — re-fetch instead of
        // leaving stale buttons (e.g. showing "Annuler" on a just-cancelled parcel).
        const allowed = await api.get(`/parcels/${this.parcel.id}/allowed-actions`)
        this.allowedActions = allowed.data.actions
        return { success: true }
      } catch (e: unknown) {
        return { success: false, message: this.extractMessage(e) }
      }
    },

    reset() {
      this.parcel = null
      this.allowedActions = []
      this.error = null
    },

    extractMessage(e: unknown): string {
      const err = e as { response?: { data?: { message?: string } } }
      return err.response?.data?.message ?? 'Une erreur est survenue'
    },
  },
})

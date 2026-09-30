export interface PublicTimelineStep {
  state: string
  label: string
  occurredAt: string | null
  done: boolean
}

export interface PublicTrackingResult {
  trackingNumber: string
  originCountry: string
  destCountry: string
  category: string
  currentState: string
  currentStateLabel: string
  estimatedDelivery: string | null
  recipientMasked: string
  timeline: PublicTimelineStep[]
}

export function useTracking(trackingNumber: string) {
  const config = useRuntimeConfig()
  const headers = config.public.apiUrl.includes('.ngrok-free.dev')
    ? { 'ngrok-skip-browser-warning': '1' }
    : undefined

  return useFetch<PublicTrackingResult>(
    `${config.public.apiUrl}/public/track/${encodeURIComponent(trackingNumber)}`,
    {
      key: `tracking-${trackingNumber}`,
      // SSR-fetched on first load, re-fetchable client-side for live refresh
      server: true,
      headers,
    },
  )
}

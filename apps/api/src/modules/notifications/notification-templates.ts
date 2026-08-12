import type { ParcelState } from '@gsg/shared-types/domain'

type TemplateFn = (recipientName: string, trackingNumber: string) => string

/**
 * One French sentence per state. Kept short on purpose — WhatsApp/SMS
 * previews truncate long text, and the tracking link (appended separately)
 * already carries the detail.
 */
const MESSAGE_TEMPLATES: Partial<Record<ParcelState, TemplateFn>> = {
  registered: (name, tn) => `Bonjour ${name}, votre colis ${tn} a été enregistré chez GSGLOGISTIQUE.`,
  received_warehouse: (name, tn) => `Bonjour ${name}, votre colis ${tn} a été réceptionné dans notre entrepôt.`,
  preparing: (name, tn) => `Bonjour ${name}, votre colis ${tn} est en préparation pour l'expédition.`,
  shipped: (name, tn) => `Bonjour ${name}, votre colis ${tn} a été expédié.`,
  in_transit: (name, tn) => `Bonjour ${name}, votre colis ${tn} est en transit.`,
  arrived_country: (name, tn) => `Bonjour ${name}, votre colis ${tn} est arrivé à destination.`,
  customs: (name, tn) => `Bonjour ${name}, votre colis ${tn} est en cours de dédouanement.`,
  out_for_delivery: (name, tn) => `Bonjour ${name}, votre colis ${tn} est disponible pour retrait.`,
  delivered: (name, tn) => `Bonjour ${name}, votre colis ${tn} a été livré. Merci de votre confiance !`,
  cancelled: (name, tn) => `Bonjour ${name}, votre colis ${tn} a été annulé.`,
}

const FALLBACK_TEMPLATE: TemplateFn = (name, tn) => `Bonjour ${name}, mise à jour sur votre colis ${tn}.`

export function renderNotificationMessage(
  state: ParcelState,
  recipientName: string,
  trackingNumber: string,
  trackingUrl: string,
): string {
  const template = MESSAGE_TEMPLATES[state] ?? FALLBACK_TEMPLATE
  return `${template(recipientName, trackingNumber)} Suivi : ${trackingUrl}`
}

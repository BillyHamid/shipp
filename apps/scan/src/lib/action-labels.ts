/**
 * Human-readable French labels + confirmation copy for each parcel action.
 * Mirrors the confirm() dialogs from the legacy Laravel app, but rendered
 * as proper in-app modals instead of native browser confirm().
 */
export const ACTION_LABELS: Record<string, { label: string; icon: string; confirm: string }> = {
  scan_in_warehouse: {
    label: 'Réceptionner en entrepôt',
    icon: '📥',
    confirm: 'Confirmer la réception de ce colis en entrepôt ?',
  },
  assign_to_box: {
    label: 'Affecter à une BOX',
    icon: '📦',
    confirm: 'Affecter ce colis à la BOX sélectionnée ?',
  },
  box_departed: {
    label: 'Marquer expédié',
    icon: '✈️',
    confirm: 'Confirmer le départ de ce colis ?',
  },
  in_flight: {
    label: 'Marquer en transit',
    icon: '🚚',
    confirm: 'Confirmer que ce colis est en transit ?',
  },
  box_arrived: {
    label: "Marquer arrivé au pays",
    icon: '🛬',
    confirm: 'Confirmer l\'arrivée de ce colis dans le pays de destination ?',
  },
  declare_customs: {
    label: 'Déclarer en dédouanement',
    icon: '🛃',
    confirm: 'Déclarer ce colis en dédouanement ?',
  },
  customs_cleared: {
    label: 'Dédouanement terminé',
    icon: '✅',
    confirm: 'Confirmer que le dédouanement est terminé ?',
  },
  deliver: {
    label: 'Livrer au destinataire',
    icon: '🎉',
    confirm: 'Confirmer la livraison ? Une photo et une signature seront requises.',
  },
  cancel: {
    label: 'Annuler le colis',
    icon: '⚠️',
    confirm: 'Cette action est irréversible. Voulez-vous vraiment annuler ce colis ?',
  },
}

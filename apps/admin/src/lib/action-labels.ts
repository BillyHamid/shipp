export const ACTION_LABELS: Record<string, { label: string; icon: string; confirm: string }> = {
  scan_in_warehouse: { label: 'Réceptionner en entrepôt', icon: 'ph:warehouse-bold', confirm: 'Confirmer la réception en entrepôt ?' },
  assign_to_box: { label: 'Affecter à une BOX', icon: 'ph:cube-bold', confirm: 'Affecter ce colis à la BOX sélectionnée ?' },
  box_departed: { label: 'Marquer expédié', icon: 'ph:airplane-tilt-bold', confirm: 'Confirmer le départ de ce colis ?' },
  in_flight: { label: 'Marquer en transit', icon: 'ph:truck-bold', confirm: 'Confirmer que ce colis est en transit ?' },
  box_arrived: { label: 'Marquer arrivé au pays', icon: 'ph:map-pin-bold', confirm: "Confirmer l'arrivée de ce colis ?" },
  declare_customs: { label: 'Déclarer en dédouanement', icon: 'ph:file-text-bold', confirm: 'Déclarer ce colis en dédouanement ?' },
  customs_cleared: { label: 'Dédouanement terminé', icon: 'ph:check-circle-bold', confirm: 'Confirmer la fin du dédouanement ?' },
  deliver: { label: 'Livrer au destinataire', icon: 'ph:flag-checkered-bold', confirm: 'Confirmer la livraison ?' },
  cancel: { label: 'Annuler le colis', icon: 'ph:x-circle-bold', confirm: 'Action irréversible. Annuler ce colis ?' },
}

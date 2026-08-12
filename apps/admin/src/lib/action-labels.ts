export const ACTION_LABELS: Record<string, { label: string; icon: string; confirm: string }> = {
  scan_in_warehouse: { label: 'Réceptionner en entrepôt', icon: '📥', confirm: 'Confirmer la réception en entrepôt ?' },
  assign_to_box: { label: 'Affecter à une BOX', icon: '📦', confirm: 'Affecter ce colis à la BOX sélectionnée ?' },
  box_departed: { label: 'Marquer expédié', icon: '✈️', confirm: 'Confirmer le départ de ce colis ?' },
  in_flight: { label: 'Marquer en transit', icon: '🚚', confirm: 'Confirmer que ce colis est en transit ?' },
  box_arrived: { label: 'Marquer arrivé au pays', icon: '🛬', confirm: "Confirmer l'arrivée de ce colis ?" },
  declare_customs: { label: 'Déclarer en dédouanement', icon: '🛃', confirm: 'Déclarer ce colis en dédouanement ?' },
  customs_cleared: { label: 'Dédouanement terminé', icon: '✅', confirm: 'Confirmer la fin du dédouanement ?' },
  deliver: { label: 'Livrer au destinataire', icon: '🎉', confirm: 'Confirmer la livraison ?' },
  cancel: { label: 'Annuler le colis', icon: '⚠️', confirm: 'Action irréversible. Annuler ce colis ?' },
}

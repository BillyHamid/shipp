# GSG Scan — PWA agent de terrain

App mobile installable pour les agents (agent_usa, agent_bf, manutentionnaire) qui scannent les colis et déclenchent les transitions d'état.

## Dev

```bash
cp .env.example .env
pnpm dev
```

Ouvre http://localhost:5174 — sur mobile réel, sers en HTTPS (obligatoire pour `getUserMedia`) ou utilise le tunnel de ton bundler.

## Flow

1. Login (email/mot de passe → JWT)
2. Scanner un QR code (caméra arrière, `@zxing/browser`)
3. L'API renvoie le colis + les actions autorisées selon le rôle et l'état actuel
4. L'agent choisit une action → confirmation → transition
5. Pour `deliver` : capture photo obligatoire avant confirmation

## Icônes manquantes

`vite.config.ts` référence `/icons/icon-192.png` et `/icons/icon-512.png` pour le manifest PWA — à générer avant un build de production (ex: via `pwa-asset-generator` à partir du SVG dans `public/favicon.svg`).

```bash
npx pwa-asset-generator public/favicon.svg public/icons --icon-only --padding "10%"
```

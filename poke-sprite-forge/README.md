# Poke Sprite Forge

Monorepo for a web-based sprite editor targeting DS Pokémon ROM hacks.

## Install

### Frontend
```bash
cd poke-sprite-forge/frontend
npm install
npm run dev
```

### Backend
```bash
cd poke-sprite-forge/worker
npm install wrangler --save-dev
```

## Deployment

1. Deploy the worker using Wrangler:
   ```bash
   npx wrangler deploy
   ```
2. Build the frontend for production:
   ```bash
   npm run build
   ```

See `r2-setup/README.md` for bucket configuration.

# Poke Sprite Forge

Monorepo for a web-based sprite editor targeting DS Pokémon ROM hacks.

## Local Development

1. Install all dependencies from the repository root:
   ```bash
   npm run install:all
   ```

2. Copy the example environment file and adjust if needed:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

3. Start both the Vite dev server and the Worker emulator:
   ```bash
   npm run dev
   ```
   - The frontend runs on [http://localhost:5173](http://localhost:5173)
   - The Worker runs on [http://localhost:8787](http://localhost:8787)

API requests are sent to the Worker via the `VITE_API_BASE_URL` variable defined
in `frontend/.env`.

The frontend uses Tailwind CSS for styling. The Worker includes permissive CORS
headers for local use, so the frontend can communicate with it directly.

## Manual Install (optional)

If you prefer installing each project separately:

### Frontend
```bash
cd poke-sprite-forge/frontend
npm install
```

### Backend
```bash
cd poke-sprite-forge/worker
npm install
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

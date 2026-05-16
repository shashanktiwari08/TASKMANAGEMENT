# Railway Deployment Guide

## Quick Fix Checklist

### 1. Railway Environment Variables (Critical)

Go to your Railway project → Variables tab and add:

| Variable | Value | Example |
|----------|-------|---------|
| `MONGODB_URI` | Your MongoDB Atlas URI | `mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority` |
| `JWT_SECRET` | Long random string | `my-super-secret-jwt-key-change-me` |
| `NODE_ENV` | `production` | `production` |
| `FRONTEND_URL` | (Optional) Your frontend URL | `https://your-app.vercel.app` |

**⚠️ DO NOT commit `.env` files to Git.** They are ignored by `.gitignore` but were added before the ignore rule.

### 2. MongoDB Atlas Setup

1. Create a cluster at https://cloud.mongodb.com
2. Create a database user
3. Whitelist `0.0.0.0/0` in Network Access (allows Railway to connect)
4. Copy the connection string and paste into Railway `MONGODB_URI`

### 3. Deployment Configuration

This repo includes:
- `railway.json` — Railway deployment config
- `Procfile` — Fallback process config
- `package.json` — Root build orchestration

Railway will:
1. Build the frontend (`npm run build` in `frontend/`)
2. Install backend dependencies
3. Start the backend (`node backend/server.js`)
4. Backend serves the built frontend from `frontend/dist`

### 4. CORS (Already Fixed)

The backend now automatically allows:
- All `*.railway.app` domains
- All `*.vercel.app` domains
- All `*.onrender.com` domains
- Your `FRONTEND_URL` env var
- Localhost for development

### 5. Frontend API URL

If you deploy frontend separately (e.g., Vercel):
- Set `VITE_API_URL` in Vercel env vars to your Railway backend URL (e.g., `https://your-app.up.railway.app`)

If you deploy as monorepo on Railway:
- Leave `VITE_API_URL` empty — the backend serves the frontend on the same origin

## Troubleshooting

### Signup returns 500 / "Network Error"

1. Check Railway logs: `railway logs`
2. Verify `MONGODB_URI` is set
3. Verify `JWT_SECRET` is set
4. Check CORS errors in browser console

### "Not allowed by CORS"

The backend now auto-allows Railway/Vercel domains. If you still see CORS errors:
1. Check the Railway logs for `[CORS] Blocked origin: ...`
2. Add your exact domain to the `FRONTEND_URL` env var

### "Cannot GET /api/..." or HTML returned for API

This was fixed. The catchall route now returns JSON 404 for `/api/*` paths.

### Frontend shows blank page

1. Check that `frontend/dist` exists after build
2. Check Railway build logs for frontend build errors
3. Verify `railway.json` build command is correct

## Testing After Deploy

1. `GET https://your-app.up.railway.app/api/health` should return `{"ok":true}`
2. `POST https://your-app.up.railway.app/api/auth/signup` should create a user
3. Browser console should show no CORS errors

## Support

If issues persist, check:
- Railway dashboard logs
- Browser DevTools → Network tab for failed requests
- Browser DevTools → Console for CORS or JS errors

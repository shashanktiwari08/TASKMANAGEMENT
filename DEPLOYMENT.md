# Railway Deployment Guide

## CRITICAL: Railway Dashboard Settings

### Step 1: Create a Single Service (Monorepo)

Railway can deploy your frontend + backend as a single service:

1. **Go to Railway Dashboard** → Your Project
2. **Create ONE service** (not separate frontend/backend services)
3. **Connect your GitHub repo**: `shashanktiwari08/TASKMANAGEMENT`
4. **Branch**: `main`

### Step 2: Set Build Command (in Railway Dashboard)

Go to your service → **Settings** → **Build**:

| Setting | Value |
|---------|-------|
| **Builder** | `Nixpacks` |
| **Build Command** | `npm install --prefix frontend && npm run build --prefix frontend && npm install --prefix backend` |

Alternatively, if Railway shows "Build Command" field:
```bash
npm install --prefix frontend && npm run build --prefix frontend && npm install --prefix backend
```

### Step 3: Set Start Command (in Railway Dashboard)

Go to your service → **Settings** → **Deploy**:

| Setting | Value |
|---------|-------|
| **Start Command** | `cd backend && npm start` |
| **Healthcheck Path** | `/api/health` |

### Step 4: Environment Variables

Go to your service → **Variables**:

| Variable | Required | Value | Example |
|----------|----------|-------|---------|
| `MONGODB_URI` | ✅ YES | Your MongoDB Atlas URI | `mongodb+srv://user:pass@cluster.mongodb.net/team_task_manager?retryWrites=true&w=majority` |
| `JWT_SECRET` | ✅ YES | Long random string | `my-super-secret-jwt-key-change-me-2026` |
| `NODE_ENV` | ✅ YES | `production` | `production` |
| `PORT` | ❌ No | Railway auto-sets this | Leave empty |
| `FRONTEND_URL` | ❌ Optional | Your Railway URL | `https://your-app.up.railway.app` |

### MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. **Network Access** → **Add IP Address** → `0.0.0.0/0` (allows Railway)
3. **Database Access** → Create a user with password
4. **Database** → **Connect** → Drivers → Node.js → Copy URI
5. Paste into Railway `MONGODB_URI` variable

## How It Works

Railway will:
1. **Build phase**: Install frontend deps → Build frontend → Install backend deps
2. **Deploy phase**: Start backend server (`node backend/server.js`)
3. Backend serves built frontend files from `frontend/dist/`
4. Single URL handles both API and frontend

## CORS (Already Fixed)

The backend auto-allows:
- All `*.railway.app` domains
- All `*.vercel.app` domains
- Your `FRONTEND_URL` env var
- Localhost for development

## Troubleshooting

### Signup returns 500 / "Network Error"

1. Check Railway logs: `railway logs`
2. Verify `MONGODB_URI` is set
3. Verify `JWT_SECRET` is set
4. Check CORS errors in browser console

### "Cannot GET /api/..." or HTML returned

This was fixed. The catchall route now returns JSON 404 for `/api/*` paths.

### Frontend shows blank page

1. Check Railway **Build logs** — did frontend build succeed?
2. Look for `[SERVE] Static files from:` in deploy logs
3. Make sure `frontend/dist` was created during build

### "Module not found" or build errors

1. Check Railway **Build logs**
2. Make sure Node.js 18+ is used (set in `package.json` engines)

## Testing After Deploy

1. `GET https://your-app.up.railway.app/api/health` → `{"ok":true}`
2. Open app in browser → DevTools → Console → no CORS errors
3. Try signup → should work

## Alternative: Deploy Backend Only + Vercel Frontend

If you want separate deployments:

**Railway Backend:**
- Root Directory: `backend/`
- Build Command: `npm install`
- Start Command: `npm start`

**Vercel Frontend:**
- Root Directory: `frontend/`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment: `VITE_API_URL=https://your-railway-app.up.railway.app`

## Support

If issues persist:
- Check Railway dashboard **Build** and **Deploy** logs
- Browser DevTools → Network tab for failed requests
- Browser DevTools → Console for CORS or JS errors

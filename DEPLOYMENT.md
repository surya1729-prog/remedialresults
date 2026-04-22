# Deployment Guide - College Portal

## Architecture
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js Express)
- **Database**: MongoDB Atlas (already configured)

---

## BACKEND DEPLOYMENT (Render)

### Prerequisites
1. Create account on render.com
2. Have MongoDB Atlas URI ready (from .env.example)

### Step 1: Prepare Backend

In `backend/` folder:
```bash
# Ensure package.json has start script
npm start  # should start on http://localhost:5000
```

### Step 2: Create Render Web Service

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub repository (remedialresults)
4. Configure:
   - **Name**: college-portal-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: backend

### Step 3: Add Environment Variables on Render

In Render dashboard → Settings → Environment:
```
MONGO_URI=mongodb://username:password@cluster.mongodb.net:27017/collegePortal?...
PORT=5000
JWT_SECRET=your-strong-secret-key-here
```

### Step 4: Get Backend URL
After deploy, Render gives you: `https://<your-backend>.onrender.com`
Save this for frontend configuration.

---

## FRONTEND DEPLOYMENT (Vercel)

### Step 1: Update API Endpoint

In `frontend/src/` find all axios calls using:
```javascript
const API_BASE = "http://localhost:5000/api";
```

Replace with:
```javascript
const API_BASE = process.env.VITE_API_URL || "http://localhost:5000/api";
```

### Step 2: Create Vercel Configuration

Create `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Step 3: Create Vercel Environment File

Create `frontend/.env.production`:
```
VITE_API_URL=https://<your-backend>.onrender.com/api
```

### Step 4: Deploy to Vercel

Option A - Connect GitHub:
1. Go to vercel.com
2. Click "Import Project"
3. Select your GitHub repository
4. Select "frontend" as root directory
5. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `https://<your-backend>.onrender.com/api`
6. Deploy

Option B - Deploy via CLI:
```bash
cd frontend
npm i -g vercel
vercel --prod
```

### Step 5: Get Frontend URL
After deploy, Vercel gives: `https://<your-frontend>.vercel.app`

---

## DATABASE (MongoDB Atlas) - Already Cloud

Your MongoDB is already hosted on Atlas. Just need to:

1. Go to https://cloud.mongodb.com
2. Find your cluster → Network Access
3. Whitelist these IPs:
   - Render: `0.0.0.0/0` (all IPs - Render dynamic)
   - Vercel: `0.0.0.0/0` (serverless dynamic IPs)

Or use: **"Allow access from anywhere"** (0.0.0.0/0)

---

## CORS Configuration (Important for Mobile)

In `backend/server.js` add:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    "https://<your-frontend>.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true
}));
```

---

## Testing Live Deployment

### Test on Desktop Browser:
1. Open `https://<your-frontend>.vercel.app`
2. Login as student / faculty / admin
3. Test all features

### Test on Mobile Phone:
1. Connect phone to same WiFi or use mobile data
2. Visit `https://<your-frontend>.vercel.app` (same URL)
3. Everything should work (HTTPS required for mobile)

---

## Troubleshooting

### Backend 502 Error on Render?
- Check environment variables are set
- Verify MongoDB Atlas IP whitelist includes Render
- Check logs: Render Dashboard → Services → Your API → Logs

### Frontend can't reach backend?
- Verify `VITE_API_URL` is correct in Vercel env vars
- Check CORS is configured
- Open browser DevTools → Network → check API calls

### Mobile shows "Cannot connect"?
- Ensure frontend URL uses HTTPS (Vercel auto-handles)
- Check backend is responding: curl `https://<backend>/api/student/status`
- Verify CORS allows frontend domain

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   STUDENT PHONE                      │
│            (Desktop or Mobile Browser)               │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
        ┌────────────────────────┐
        │  Frontend (Vercel)     │  https://...vercel.app
        │  - React + Vite        │  Shows UI, handles auth
        │  - Authenticated       │
        └──────────┬─────────────┘
                   │ API Calls
                   │ (JSON over HTTPS)
                   ▼
        ┌────────────────────────┐
        │  Backend (Render)      │  https://...onrender.com
        │  - Node.js Express     │  Business logic, auth
        │  - REST API            │  JWT tokens
        └──────────┬─────────────┘
                   │ TCP/IP
                   ▼
        ┌────────────────────────┐
        │  MongoDB Atlas         │  Hosted on AWS
        │  - Cloud Database      │  No need to deploy
        │  - Automatic backups   │
        └────────────────────────┘
```

---

## Live URLs (After Deployment)

Replace with your actual URLs:
- **Frontend**: `https://college-portal.vercel.app`
- **Backend API**: `https://college-portal-api.onrender.com`
- **Database**: Automatically handled by MongoDB Atlas

Users on any device (desktop/mobile) will access the same URLs!

---

## Important Notes

1. **Render free tier**: App goes to sleep after 15 min inactivity - can be paid for always-on
2. **Vercel**: Free tier includes unlimited bandwidth
3. **MongoDB Atlas**: Free tier 512MB storage - upgrade if needed
4. **HTTPS**: Both Render and Vercel provide automatic HTTPS
5. **Mobile**: Works perfectly on iOS and Android via browser

---

## Next Steps

1. Prepare your `backend/.env` with MongoDB credentials
2. Create Render account and deploy backend first
3. Get backend URL (e.g., `https://college-portal-api.onrender.com`)
4. Update frontend with that URL
5. Deploy frontend to Vercel
6. Test on mobile

Need help with any specific step?

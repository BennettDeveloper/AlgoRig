# AlgoRig Deployment Checklist

## Backend (Render)

- [ ] Set `JWT_SECRET` to output of: `openssl rand -base64 32`
- [ ] Set `GOOGLE_CLIENT_ID` from Google Cloud Console
- [ ] Set `GOOGLE_CLIENT_SECRET` from Google Cloud Console
- [ ] Set `GITHUB_CLIENT_ID` from GitHub OAuth App settings
- [ ] Set `GITHUB_CLIENT_SECRET` from GitHub OAuth App settings
- [ ] Set `FRONTEND_URL=https://crafty-hire.vercel.app`
- [ ] Set `SPRING_PROFILES_ACTIVE=production`
- [ ] Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` for production PostgreSQL database
- [ ] Add Render backend URL to Google OAuth authorized redirect URIs:
      `https://<render-url>/login/oauth2/code/google`
- [ ] Add Render backend URL to GitHub OAuth App callback URL:
      `https://<render-url>/login/oauth2/code/github`

## Frontend (Vercel)

- [ ] Set `VITE_API_URL=https://<render-url>/api` in Vercel dashboard
- [ ] Set `VITE_BACKEND_URL=https://<render-url>` in Vercel dashboard
- [ ] Verify `https://crafty-hire.vercel.app` is in `CorsConfig.java` allowed origins
- [ ] Verify `VITE_BACKEND_URL` is set before deploying (OAuth buttons use it for redirects)

## Post-Deploy Smoke Test

- [ ] `GET https://<render-url>/api/robots` returns 200 with 30 robots
- [ ] `POST https://<render-url>/api/auth/register` creates a user and returns a JWT
- [ ] `POST https://<render-url>/api/auth/login` returns a JWT
- [ ] `GET https://<render-url>/api/scripts` without token returns `{"error":"Unauthorized","status":401}`
- [ ] `GET https://crafty-hire.vercel.app` loads the Dashboard
- [ ] Login flow (email/password) works end-to-end in production
- [ ] OAuth Google button redirects to Google consent screen
- [ ] OAuth GitHub button redirects to GitHub authorization page
- [ ] After OAuth, `/oauth/callback?token=...` stores the token and redirects to `/`
- [ ] Creating a script, launching a battle, and watching a replay all work logged in

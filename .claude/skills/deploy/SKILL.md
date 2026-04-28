---
name: deploy
description: Deploy Cool Runnings to Vercel production
disable-model-invocation: true
allowed-tools: Bash(npm *) Bash(git *)
---

# Deploy to Production

## Pre-deploy checks

1. Run TypeScript check: `npx tsc --noEmit`
2. Run lint: `npm run lint`
3. Build locally: `npm run build`
4. Verify git is clean: `git status`
5. Ensure you're on `main` branch

## Deploy

6. Push to main: `git push origin main`
7. Vercel auto-deploys from main

## Post-deploy verification

8. Check Vercel dashboard for build success
9. Test login flow
10. Test recording a movement
11. Check Supabase logs for errors

If the build fails, read the Vercel build log and fix errors before retrying.

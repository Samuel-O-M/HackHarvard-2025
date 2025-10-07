# GitHub Pages Deployment Guide

This guide will help you deploy the frontend-demo to GitHub Pages.

## Prerequisites

1. A GitHub repository for your project
2. Node.js and npm installed
3. Git configured with your GitHub account

## Step 1: Initial Setup (One-time)

The frontend-demo is already configured with:
- ✅ `gh-pages` package installed
- ✅ Base path set to `/HackHarvard-2025/` in `vite.config.js`
- ✅ Homepage configured in `package.json`
- ✅ Deploy script added to `package.json`
- ✅ 404.html for client-side routing
- ✅ .nojekyll to prevent Jekyll processing

## Step 2: Deploy to GitHub Pages

### Option A: Quick Deploy (Recommended)

From the `frontend-demo` directory, run:

```bash
npm run deploy
```

This will:
1. Build the production version of the app
2. Create/update the `gh-pages` branch
3. Push the built files to GitHub

### Option B: Manual Deploy

If you prefer to deploy manually:

```bash
# Build the app
npm run build

# Deploy the dist folder to gh-pages branch
npx gh-pages -d dist
```

## Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Click on "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Source", select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Click "Save"

## Step 4: Access Your Demo

After a few minutes, your demo will be available at:

```
https://Samuel-O-M.github.io/HackHarvard-2025
```

**Note**: Replace `Samuel-O-M` with your GitHub username if different.

## Updating the Demo

Whenever you make changes and want to update the deployed demo:

```bash
cd frontend-demo
npm run deploy
```

GitHub Pages will automatically update within a few minutes.

## Troubleshooting

### Issue: 404 Error on Routes

**Solution**: Make sure the 404.html file exists in the `public` folder and gets copied during build.

### Issue: Assets Not Loading

**Solution**: Verify that `base: '/HackHarvard-2025/'` is set correctly in `vite.config.js`.

### Issue: Deploy Script Fails

**Solution**: 
1. Check that you have write access to the repository
2. Ensure git is configured correctly
3. Try running `git config --global user.email "your@email.com"`
4. Try running `git config --global user.name "Your Name"`

### Issue: Audio Files Not Playing

**Solution**: 
1. Verify audio files exist in `public/dummy_audio/`
2. Check browser console for 404 errors
3. Ensure paths in `Study.jsx` use `/dummy_audio/` prefix

## Local Testing Before Deploy

To test the production build locally before deploying:

```bash
npm run build
npm run preview
```

This will serve the built files at http://localhost:4173 (or similar).

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `public/` with your domain name
2. Configure DNS records with your domain provider
3. Update the `homepage` field in `package.json`
4. Update the `base` field in `vite.config.js`

## Notes

- The demo uses static dummy data and won't persist changes
- Backend features (creating notes, optimization) will show alerts
- All changes reset on page reload
- Audio playback requires browser permissions

## Support

For issues with the full version (with backend), please visit:
https://github.com/Samuel-O-M/HackHarvard-2025


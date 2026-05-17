# GitHub Pages Deployment Setup

## Overview
This project is configured to automatically deploy to GitHub Pages whenever you push to the `main` or `master` branch.

## Prerequisites
- Your repository must be on GitHub
- Your repository must be public (or have GitHub Pages enabled for private repos with GitHub Pro)

## Configuration Steps

### 1. Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - Select **GitHub Actions** as the source
   - Leave the branch selection as-is (the workflow handles deployment)

### 2. Verify Project Configuration
Your `vite.config.js` already has the correct base path set:
```javascript
base: '/nstp-system/',
```
This ensures assets are served from the correct URL on GitHub Pages.

## How It Works

The deployment workflow (`.github/workflows/deploy.yml`):
1. **Triggers** on push to `main` or `master` branch
2. **Builds** the project using `npm run build`
3. **Uploads** the `dist` folder as a GitHub Pages artifact
4. **Deploys** automatically using the official GitHub Pages action

## Automatic Deployment

### Push to Deploy
Simply push to the main branch:
```bash
git add .
git commit -m "your message"
git push origin main
```

The workflow will automatically:
- Install dependencies with `npm ci`
- Build the production bundle
- Deploy to GitHub Pages

### View Deployment Status
1. Go to your repository on GitHub
2. Click **Actions** tab to see workflow runs
3. Green checkmark = successful deployment
4. Access your site at: `https://<username>.github.io/nstp-system/`

## Pull Request Previews
The workflow also runs on pull requests (builds but doesn't deploy) to ensure your changes build successfully before merging.

## Troubleshooting

### Build Fails
- Check the GitHub Actions logs for error messages
- Ensure `npm run build` works locally: `npm run build`
- Verify all dependencies are installed: `npm install`

### Site Not Updating
- Check GitHub Actions tab to confirm workflow completed successfully
- Clear browser cache or wait a few minutes for GitHub Pages to update
- Verify the `dist` folder contains your built files

### 404 Errors for Assets
- This is usually caused by incorrect `base` path in `vite.config.js`
- Current setting is correct: `base: '/nstp-system/'`
- If your repository name changes, update the base path accordingly

## Environment Variables
If your build requires environment variables, add them as GitHub Secrets:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add new repository secret
3. Reference in workflow as: `${{ secrets.SECRET_NAME }}`

## Notes
- The backend API is not deployed to GitHub Pages (frontend only)
- For production backend deployment, configure a separate backend hosting solution (Heroku, AWS, DigitalOcean, etc.)
- The GitHub Pages site is read-only; backend requests will need to be sent to your backend server

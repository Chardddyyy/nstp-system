import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');
const manifestJson = path.join(distDir, 'manifest.json');
const cvsuPng = path.join(distDir, 'cvsu.png');
const cvsuLogoPng = path.join(distDir, 'cvsu-logo.png');
const chedLogoPng = path.join(distDir, 'ched-logo.png');

if (fs.existsSync(indexHtml)) {
  const routes = [
    'login',
    'enrollment',
    'students',
    'dashboard',
    'admin',
    'admin/dashboard',
    'instructor',
    'instructor/dashboard',
    'digital-id',
    'id-card',
    'chat',
    'calendar',
    'letter-formats',
    'attendance',
    'reports',
    'grades',
    'profile',
    'archives',
    'settings'
  ];

  const htmlContent = fs.readFileSync(indexHtml, 'utf8');
  const manifestContent = fs.existsSync(manifestJson) ? fs.readFileSync(manifestJson, 'utf8') : null;

  routes.forEach(route => {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    // Write index.html for SPA route resolution
    fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent);

    // Also copy manifest.json & assets to handle any nested relative requests without 404
    if (manifestContent) {
      fs.writeFileSync(path.join(routeDir, 'manifest.json'), manifestContent);
    }
    if (fs.existsSync(cvsuPng)) {
      fs.copyFileSync(cvsuPng, path.join(routeDir, 'cvsu.png'));
    }
    if (fs.existsSync(cvsuLogoPng)) {
      fs.copyFileSync(cvsuLogoPng, path.join(routeDir, 'cvsu-logo.png'));
    }
    if (fs.existsSync(chedLogoPng)) {
      fs.copyFileSync(chedLogoPng, path.join(routeDir, 'ched-logo.png'));
    }
  });

  console.log(`✅ Generated comprehensive static SPA route directories & fallback assets for: ${routes.join(', ')}`);
} else {
  console.warn('⚠️ dist/index.html not found, skipping route generation.');
}

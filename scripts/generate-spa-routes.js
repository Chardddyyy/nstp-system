import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  const routes = [
    'login', 'enrollment', 'students', 'dashboard', 'digital-id',
    'chat', 'attendance', 'reports', 'grades', 'profile', 'archives', 'settings'
  ];

  const htmlContent = fs.readFileSync(indexHtml, 'utf8');

  routes.forEach(route => {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent);
  });
  console.log(`✅ Generated static SPA route files for: ${routes.join(', ')}`);
} else {
  console.warn('⚠️ dist/index.html not found, skipping route generation.');
}

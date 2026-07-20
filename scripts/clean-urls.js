// One-off script: rewrites internal nav/asset links across all frontend HTML
// pages to root-absolute paths, so pages can be served at clean URLs
// (/services instead of /pages/services.html) without breaking relative
// css/js/asset references or internal navigation.
const fs = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const indexFile = path.join(FRONTEND, 'index.html');
const pagesDir = path.join(FRONTEND, 'pages');
const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html')).map(f => path.join(pagesDir, f));

function applyReplacements(content, replacements) {
  let out = content;
  for (const [from, to] of replacements) {
    out = out.split(from).join(to);
  }
  return out;
}

// index.html (root level)
{
  const replacements = [
    ['href="index.html"', 'href="/"'],
    ['href="pages/services.html"', 'href="/services"'],
    ['href="pages/freight-process.html"', 'href="/freight-process"'],
    ['href="pages/register.html"', 'href="/register"'],
    ['href="pages/upcoming.html"', 'href="/upcoming"'],
    ['href="pages/marketplace.html"', 'href="/marketplace"'],
    ['="css/', '="/css/'],
    ['="js/', '="/js/'],
    ['="assets/', '="/assets/'],
  ];
  const content = fs.readFileSync(indexFile, 'utf8');
  fs.writeFileSync(indexFile, applyReplacements(content, replacements));
  console.log('Updated', path.relative(FRONTEND, indexFile));
}

// pages/*.html
for (const file of pageFiles) {
  const replacements = [
    ['../index.html', '/'],
    ['="services.html"', '="/services"'],
    ['="freight-process.html"', '="/freight-process"'],
    ['="register.html"', '="/register"'],
    ['="upcoming.html"', '="/upcoming"'],
    ['="marketplace.html"', '="/marketplace"'],
    ['="privacy.html"', '="/privacy"'],
    ['="terms.html"', '="/terms"'],
    ['="../css/', '="/css/'],
    ['="../js/', '="/js/'],
    ['="../assets/', '="/assets/'],
  ];
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, applyReplacements(content, replacements));
  console.log('Updated', path.relative(FRONTEND, file));
}

console.log('Done.');

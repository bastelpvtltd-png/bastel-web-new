// One-off script: adds data-cms-logo="site_logo_url" to every <img src="/assets/bastel.png">
// across the site so shared.js can swap in an admin-uploaded logo replacement.
const fs = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.html')) out.push(p);
  }
}

const files = [];
walk(FRONTEND, files);

let totalReplaced = 0;
for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  s = s.split('src="/assets/bastel.png"').join('src="/assets/bastel.png" data-cms-logo="site_logo_url"');
  if (s !== before) {
    const count = (before.match(/src="\/assets\/bastel\.png"/g) || []).length;
    totalReplaced += count;
    fs.writeFileSync(file, s);
    console.log(`${path.relative(FRONTEND, file)}: wired ${count}`);
  }
}
console.log(`Done. ${totalReplaced} <img> tags wired total.`);

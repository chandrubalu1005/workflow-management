const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.jsx')) {
            results.push(fullPath);
        }
    });
    return results;
}
const files = walk('c:/Users/ASUS/Videos/work flow management/client/src');
let count = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    content = content.replace(/#A855F7/gi, '#F59E0B');
    content = content.replace(/#C084FC/gi, '#FBBF24');
    content = content.replace(/#7C3AED/gi, '#F59E0B');
    content = content.replace(/168\s*,\s*85\s*,\s*247/g, '245,158,11');
    content = content.replace(/var\(--wp-violet\)/g, 'var(--brand-primary)');
    content = content.replace(/var\(--wp-violet-glow\)/g, 'var(--shadow-glow)');
    if (original !== content) {
        fs.writeFileSync(f, content, 'utf8');
        count++;
    }
});
console.log('Successfully updated ' + count + ' files.');

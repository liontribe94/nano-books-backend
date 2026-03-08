const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
    fs.readdirSync(dir).forEach(f => {
        let d = path.join(dir, f);
        if (fs.statSync(d).isDirectory()) walk(d, cb);
        else cb(d);
    });
}

let tables = new Set();
walk('./src', f => {
    if (f.endsWith('.js')) {
        let content = fs.readFileSync(f, 'utf8');
        let matches = content.match(/\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g);
        if (matches) {
            matches.forEach(m => {
                let table = m.replace(/\.from\(['"]/, '').replace(/['"]\)/, '');
                tables.add(table);
            });
        }
    }
});
console.log("TABLES_FOUND: " + Array.from(tables).join(', '));

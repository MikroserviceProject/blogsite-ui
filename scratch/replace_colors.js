const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf8');

css = css.replace(/#4f46e5/g, '#2563eb');
css = css.replace(/#6366f1/g, '#3b82f6');
css = css.replace(/#4338ca/g, '#1d4ed8');
css = css.replace(/#3730a3/g, '#1e40af');
css = css.replace(/79,\s*70,\s*229/g, '37, 99, 235');
css = css.replace(/Indigo \/ Violet/g, 'Blue / Ocean');

fs.writeFileSync('src/styles.css', css);
console.log('Colors replaced successfully!');

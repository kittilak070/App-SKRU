const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'modules');
const modules = fs.readdirSync(modulesDir).filter(f => fs.statSync(path.join(modulesDir, f)).isDirectory());

console.log('=== STRICT AUDIT OF BUTTONS & INTERACTIVE ELEMENTS ACROSS ALL MODULES ===\n');

const results = [];

function findFiles(dir, ext) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') {
      out = out.concat(findFiles(full, ext));
    } else if (e.isFile() && full.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

modules.forEach(mod => {
  const modPath = path.join(modulesDir, mod);
  const htmlFiles = findFiles(modPath, '.html');
  const jsFiles = findFiles(modPath, '.js');

  let allJsContent = '';
  jsFiles.forEach(jf => {
    allJsContent += '\n' + fs.readFileSync(jf, 'utf8');
  });

  htmlFiles.forEach(hf => {
    const html = fs.readFileSync(hf, 'utf8');
    const relHtml = path.relative(__dirname, hf);

    // Extract inline scripts
    const inlineScripts = (html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [])
      .map(s => s.replace(/<\/?script[\s\S]*?>/gi, ''))
      .join('\n');
    const fullJs = allJsContent + '\n' + inlineScripts;

    // Split HTML by forms to know if a button is inside a form
    // Check all buttons
    const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    let match;
    while ((match = buttonRegex.exec(html)) !== null) {
      const attrs = match[1];
      const innerHtml = match[2];
      const text = innerHtml.replace(/<[^>]+>/g, '').trim().substring(0, 30);
      const tagStr = match[0].substring(0, Math.min(match[0].indexOf('>') + 1, 100));

      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const classMatch = attrs.match(/class=["']([^"']+)["']/i);
      const onclickMatch = attrs.match(/onclick=["']([^"']+)["']/i);
      const typeMatch = attrs.match(/type=["']([^"']+)["']/i);
      const dataAttrs = [...attrs.matchAll(/data-([a-z0-9_-]+)=["']([^"']+)["']/gi)];
      let dataHandled = false;
      for (const da of dataAttrs) {
        const fullAttr = da[0];
        const attrName = da[1];
        const attrVal = da[2];
        if (fullJs.includes(`data-${attrName}`) || fullJs.includes(`dataset.${attrName}`) || fullJs.includes(`dataset['${attrName}']`) || fullJs.includes(attrVal)) {
          dataHandled = true;
          break;
        }
      }

      const id = idMatch ? idMatch[1] : null;
      const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
      const onclick = onclickMatch ? onclickMatch[1] : null;
      const type = typeMatch ? typeMatch[1].toLowerCase() : null;

      // Is it inside a form?
      const beforeBtn = html.substring(0, match.index);
      const lastFormOpen = beforeBtn.lastIndexOf('<form');
      const lastFormClose = beforeBtn.lastIndexOf('</form>');
      const isInsideForm = lastFormOpen > lastFormClose;

      let handled = false;
      let reason = '';

      if (onclick) {
        handled = true;
      } else if (id && fullJs.includes(id)) {
        handled = true;
      } else if (dataHandled) {
        handled = true;
      } else if (classes.length > 0) {
        // Check if any specific class is targeted in JS (like .btn-back, .tab-btn, etc.)
        for (const cls of classes) {
          // Ignore purely utility CSS classes like flex, text-white, p-2, etc.
          if (['flex', 'items-center', 'justify-center', 'text-white', 'rounded', 'p-2', 'relative', 'hidden', 'btn'].includes(cls)) continue;
          if (fullJs.includes('.' + cls) || fullJs.includes(`'${cls}'`) || fullJs.includes(`"${cls}"`)) {
            handled = true;
            break;
          }
        }
      }

      if (!handled && isInsideForm && (type === 'submit' || !type)) {
        handled = true; // Submit button inside form
      }

      if (!handled) {
        results.push({
          module: mod,
          file: relHtml,
          tag: tagStr,
          text: text || '(icon)',
          id: id || '(no id)',
          classes: classes.join(' '),
          isInsideForm
        });
      }
    }
  });
});

// Also scan root HTML files (index.html, wrapper pages, etc.)
const rootHtmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
rootHtmlFiles.forEach(hf => {
  const fullPath = path.join(__dirname, hf);
  const html = fs.readFileSync(fullPath, 'utf8');
  const inlineScripts = (html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [])
    .map(s => s.replace(/<\/?script[\s\S]*?>/gi, ''))
    .join('\n');

  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = buttonRegex.exec(html)) !== null) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim().substring(0, 30);
    const tagStr = match[0].substring(0, Math.min(match[0].indexOf('>') + 1, 100));

    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const classMatch = attrs.match(/class=["']([^"']+)["']/i);
    const onclickMatch = attrs.match(/onclick=["']([^"']+)["']/i);
    const typeMatch = attrs.match(/type=["']([^"']+)["']/i);

    const id = idMatch ? idMatch[1] : null;
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
    const onclick = onclickMatch ? onclickMatch[1] : null;
    const type = typeMatch ? typeMatch[1].toLowerCase() : null;

    let handled = false;
    if (onclick) {
      handled = true;
    } else if (id && inlineScripts.includes(id)) {
      handled = true;
    } else if (classes.length > 0) {
      for (const cls of classes) {
        if (['flex', 'items-center', 'justify-center', 'text-white', 'rounded', 'p-2', 'relative', 'hidden', 'btn'].includes(cls)) continue;
        if (inlineScripts.includes('.' + cls) || inlineScripts.includes(`'${cls}'`) || inlineScripts.includes(`"${cls}"`)) {
          handled = true;
          break;
        }
      }
    }

    if (!handled) {
      results.push({
        module: 'root',
        file: hf,
        tag: tagStr,
        text: text || '(icon)',
        id: id || '(no id)',
        classes: classes.join(' '),
        isInsideForm: false
      });
    }
  }
});

console.log(`Results: Found ${results.length} unhandled buttons across all modules and root files.\n`);
results.forEach((r, i) => {
  console.log(`[${i + 1}] [${r.module}] ${r.file}`);
  console.log(`    Tag: ${r.tag}`);
  console.log(`    Text: "${r.text}" | ID: "${r.id}" | Form: ${r.isInsideForm}`);
  console.log(`    Classes: ${r.classes}\n`);
});

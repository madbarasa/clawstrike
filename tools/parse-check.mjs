import { promises as fs } from 'fs';
const files = ['src/graphics/ui.js','src/graphics/widgets.js','src/graphics/button.js','src/graphics/hint.js'];
for (const f of files) {
  const code = await fs.readFile(f, 'utf8');
  try { new Function(code); console.log('OK', f); } catch (e) { console.log('FAIL', f, e.message); }
}

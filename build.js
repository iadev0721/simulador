// Genera un HTML autocontenido por materia: node build.js
// Cada materia vive en su carpeta con un banco.js (COURSE, TOPICS, STYLES, BANK, CONTRASTS).
const fs = require('fs');
const path = require('path');

const COURSES = [
  {dir: 'nube', out: '../Simulacro-SD.html', web: 'nube.html'},
  {dir: 'dessoft', out: '../Simulacro-DesSoft.html', web: 'dessoft.html'}
];
// Carpeta que se sirve por el túnel: solo las apps y un índice, nada más del proyecto
const WEB = path.join(__dirname, 'publico');
fs.mkdirSync(WEB, {recursive: true});
const built = [];

const engine = fs.readFileSync(path.join(__dirname, 'engine.html'), 'utf8');
let failed = false;

for (const c of COURSES) {
  const src = fs.readFileSync(path.join(__dirname, c.dir, 'banco.js'), 'utf8');
  const w = {};
  new Function('window', src)(w);
  const errors = [];
  const groups = new Set(w.CONTRASTS.map(x => x.g));
  w.BANK.forEach((q, i) => {
    const tag = `#${i} "${q.q.slice(0, 40)}"`;
    if (q.o.length !== 4) errors.push(`${tag}: necesita 4 opciones`);
    if (q.n.length !== 4) errors.push(`${tag}: necesita 4 notas`);
    if (q.n[q.a] !== null) errors.push(`${tag}: la nota de la correcta debe ser null`);
    if (q.n.some((x, j) => j !== q.a && !x)) errors.push(`${tag}: falta una nota de distractor`);
    if (!w.TOPICS[q.t]) errors.push(`${tag}: tema ${q.t} no existe`);
    if (!w.STYLES[q.s]) errors.push(`${tag}: estilo ${q.s} no existe`);
    if (new Set(q.o).size !== 4) errors.push(`${tag}: opciones repetidas`);
  });
  if (errors.length) { failed = true; console.error(`[${c.dir}] ${errors.length} errores:\n  ` + errors.join('\n  ')); continue; }

  const html = engine
    .replace('{{TITLE}}', w.COURSE.docTitle || w.COURSE.title)
    .replace('<script src="banco.js"></script>', () => '<script>\n' + src + '\n</script>');
  fs.writeFileSync(path.join(__dirname, c.out), html);
  fs.writeFileSync(path.join(WEB, c.web), '<!doctype html>\n<html lang="es">\n' + html);
  built.push({href: c.web, title: w.COURSE.title, eyebrow: w.COURSE.eyebrow, n: w.BANK.length});
  const byTopic = Object.keys(w.TOPICS).map(t => `${t}:${w.BANK.filter(q => q.t === t).length}`).join(' ');
  const ungrouped = [...new Set(w.BANK.map(q => q.g).filter(g => g && !groups.has(g)))];
  console.log(`[${c.dir}] ${w.BANK.length} preguntas (${byTopic}) → ${c.out}` + (ungrouped.length ? `  · grupos sin tabla: ${ungrouped.join(', ')}` : ''));
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
fs.writeFileSync(path.join(WEB, 'index.html'), `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Simulacros de estudio</title>
<style>
:root{--bg:#e9edf3;--paper:#fff;--ink:#18202c;--muted:#5a6575;--line:#d3dae4;--accent:#1e4fa3}
@media (prefers-color-scheme:dark){:root{--bg:#0e131b;--paper:#161d28;--ink:#e4e9f1;--muted:#97a2b3;--line:#2a3443;--accent:#7ea4ff;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 "Segoe UI",system-ui,sans-serif}
main{max-width:560px;margin:0 auto;padding:32px max(16px,env(safe-area-inset-right)) 32px max(16px,env(safe-area-inset-left));display:flex;flex-direction:column;gap:14px}
h1{margin:0 0 6px;font-size:1.6rem}
a{display:block;text-decoration:none;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:16px 18px}
a:hover,a:focus-visible{border-color:var(--accent);outline:none}
small{display:block;color:var(--muted);font-size:.8rem;letter-spacing:.04em;text-transform:uppercase}
b{display:block;font-size:1.15rem;margin:2px 0}
span{color:var(--muted);font-size:.9rem}
</style></head><body><main>
<h1>Simulacros de estudio</h1>
${built.map(b => `<a href="${b.href}"><small>${esc(b.eyebrow)}</small><b>${esc(b.title)}</b><span>${b.n} preguntas</span></a>`).join('\n')}
</main></body></html>
`);
process.exit(failed ? 1 : 0);

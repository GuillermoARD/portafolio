// Levanta el backend y el frontend a la vez, sin dependencias extra.
import { spawn } from 'node:child_process';

const tasks = [
  { name: 'server', color: '\x1b[35m', args: ['run', 'dev', '-w', 'server'] },
  { name: 'client', color: '\x1b[36m', args: ['run', 'dev', '-w', 'client'] },
];

const children = tasks.map(({ name, color, args }) => {
  const child = spawn('npm', args, { shell: true, env: { ...process.env, FORCE_COLOR: '1' } });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) if (line) out.write(prefix + line + '\n');
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}terminó con código ${code}`);
    shutdown(code ?? 0);
  });
  return child;
});

let closing = false;
function shutdown(code) {
  if (closing) return;
  closing = true;
  for (const child of children) if (!child.killed) child.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

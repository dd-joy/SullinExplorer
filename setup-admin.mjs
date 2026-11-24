import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { randomBytes, scryptSync } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

let hidden = false;
const output = new Writable({ write(chunk, encoding, done) { if (!hidden) process.stdout.write(chunk, encoding); done(); } });
const rl = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
const ask = text => new Promise(resolve => rl.question(text, resolve));
try {
  const email = (await ask('Admin email: ')).trim().toLowerCase();
  process.stdout.write('Password (at least 12 characters, hidden): ');
  hidden = true;
  const password = await ask('');
  process.stdout.write('\nConfirm password: ');
  const confirmation = await ask('');
  process.stdout.write('\n');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password !== confirmation) throw new Error('Check email, password length and confirmation.');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  await writeFile(new URL('.admin-auth.json', import.meta.url), JSON.stringify({ email, salt, hash }), { mode: 0o600 });
  process.stdout.write('Admin account saved. Run npm start.\n');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rl.close(); }

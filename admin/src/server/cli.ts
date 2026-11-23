// Kelola admin dari terminal / docker exec:
//   node dist/server/cli.js add-admin email@contoh.com "Nama"     (password ditanya, tidak tampil)
//   node dist/server/cli.js set-password email@contoh.com
//   node dist/server/cli.js remove-admin email@contoh.com
//   node dist/server/cli.js list-admins
import readline from 'node:readline';
import { createUser, setPassword, removeUser, listUsers } from './auth.ts';
import { closeDb } from './db.ts';

function ask(q: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
    }
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a); });
  });
}

const [cmd, a1, a2] = process.argv.slice(2);
try {
  if (cmd === 'add-admin') {
    if (!a1) throw new Error('Pemakaian: add-admin <email> [nama]');
    const pw = process.env.NEW_PASSWORD ?? (await ask('Password (min 10, huruf+angka): ', true));
    const u = await createUser(a1, a2 ?? '', pw);
    console.log(`Admin dibuat: ${u.email}`);
  } else if (cmd === 'set-password') {
    if (!a1) throw new Error('Pemakaian: set-password <email>');
    await setPassword(a1, process.env.NEW_PASSWORD ?? (await ask('Password baru: ', true)));
    console.log('Password diganti, semua sesi admin itu dikeluarkan.');
  } else if (cmd === 'remove-admin') {
    if (!a1) throw new Error('Pemakaian: remove-admin <email>');
    removeUser(a1);
    console.log('Admin dihapus.');
  } else if (cmd === 'list-admins') {
    for (const u of listUsers()) console.log(`${u.email}\t${u.name}\t${new Date(u.created_at).toISOString().slice(0, 10)}`);
  } else {
    console.log('Perintah: add-admin | set-password | remove-admin | list-admins');
    process.exitCode = 1;
  }
} catch (e) {
  console.error('Gagal:', (e as Error).message);
  process.exitCode = 1;
} finally {
  closeDb();
}

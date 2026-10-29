import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

// Recria o banco de teste (arquivo SQLite descartavel) a cada execucao.
export default function globalSetup() {
  for (const sufixo of ['', '-journal']) {
    const arquivo = join(__dirname, '..', 'prisma', 'test.db' + sufixo);
    if (existsSync(arquivo)) rmSync(arquivo);
  }
  execSync('npx prisma db push --skip-generate', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}

import { execSync } from 'child_process';

try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  execSync('git config core.hooksPath .githooks');
} catch {
  // 非 git 目录（例如打包产物）跳过
}

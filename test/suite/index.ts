import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
  // Configure Mocha options here
  const mocha = new Mocha({
    ui: 'tdd',          // VS Code extension testing standard
    color: true,        // Enable colored terminal output
    timeout: 20000,     // Time out after 20s for extension activation overhead
    reporter: 'spec'    // Standard hierarchical console output
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    glob('**/*.test.js', { cwd: testsRoot })
      .then((files) => {
        files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

        try {
          mocha.run((failures) => {
            if (failures > 0) {
              reject(new Error(`${failures} tests failed.`));
            } else {
              resolve();
            }
          });
        } catch (err) {
          reject(err);
        }
      })
      .catch((err) => reject(err));
  });
}
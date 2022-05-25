import * as path from 'path';
import { build } from 'esbuild';
import * as fs from 'fs';

export async function bundleConfigFile(
  fileName: string,
): Promise<{ code: string; dependencies: string[] }> {
  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    write: false,
    platform: 'node',
    bundle: true,
    format: 'esm',
    sourcemap: false,
    metafile: true,
    plugins: [
      {
        name: 'externalize-deps',
        setup(build): void {
          build.onResolve({ filter: /.*/ }, args => {
            const id = args.path;
            if (!id.startsWith('.') && !path.isAbsolute(id)) {
              return {
                external: true,
              };
            }
            return null;
          });
        },
      },
      {
        name: 'replace-import-meta',
        setup(build): void {
          build.onLoad({ filter: /\.[jt]s$/ }, async args => {
            const contents = await fs.promises.readFile(args.path, 'utf8');
            return {
              loader: args.path.endsWith('.ts') ? 'ts' : 'js',
              contents: contents
                .replace(
                  /\bimport\.meta\.url\b/g,
                  JSON.stringify(`file://${args.path}`),
                )
                .replace(
                  /\b__dirname\b/g,
                  JSON.stringify(path.dirname(args.path)),
                )
                .replace(/\b__filename\b/g, JSON.stringify(args.path)),
            };
          });
        },
      },
    ],
  });
  const { text } = result.outputFiles[0];
  return {
    code: text,
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
  };
}

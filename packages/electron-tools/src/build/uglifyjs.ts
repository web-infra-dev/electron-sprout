import uglifyjs from 'uglify-js';
import fs from 'fs-extra';
import { findFiles } from '@/utils/find-files';

export const findAllJs = (options: { srcDir: string; ignore: string[] }) => {
  const { srcDir, ignore = ['**/*/*.dev.js'] } = options;
  return findFiles({
    srcDir,
    ignore,
    extensions: ['.js'],
  });
};

const doUglify = (file: string) =>
  fs.readFile(file, 'utf8').then(code => {
    const result = uglifyjs.minify(code, {
      mangle: { toplevel: true },
      compress: {},
    });

    return fs.writeFile(file, result.code, {
      encoding: 'utf8',
    });
  });

export const uglify = (options: {
  srcDir: string;
  ignore?: string[];
  parallel?: number;
}) => {
  const { parallel = 5, srcDir, ignore = [] } = options;
  const result = findAllJs({
    srcDir,
    ignore,
  });
  return new Promise((resolve, reject) => {
    try {
      let curIdx = parallel;
      let finishedCount = 0;
      const doNext = () => {
        finishedCount++;
        if (curIdx <= result.length - 1) {
          doUglify(result[curIdx++]).then(() => {
            doNext();
          });
        } else if (finishedCount === result.length) {
          resolve(true);
        }
      };
      for (let i = 0; i < Math.min(parallel, result.length); i++) {
        doUglify(result[i]).then(doNext);
      }
    } catch (error) {
      reject(error);
    }
  });
};

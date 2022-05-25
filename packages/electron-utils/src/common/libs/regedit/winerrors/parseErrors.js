const fs = require('fs');
const { mainLog } = require('@modern-js/electron-log');

let errors = fs.readFileSync('error.txt').toString();
errors = errors.split(/^wbem/m);
errors.shift();
const results = [];

for (let i = 0; i < errors.length; i++) {
  const splitted = errors[i].split('\n');

  const result = {
    error: `wbem${splitted[0]}`,
    code: parseInt(splitted[1]),
    description: splitted[2],
  };

  if (result.description) {
    result.description = result.description.replace(/'/g, "\\'");
  }

  results.push(result);
}

mainLog.info(JSON.stringify(results));

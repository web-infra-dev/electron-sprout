import { mergeWith, isArray, cloneDeep } from 'lodash';
import { readFileSync, existsSync } from 'fs-extra';
import { parse as jsonParse } from 'json5';

export const toArrayBuffer = (buf: Buffer) => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
};

export const mergeObj = (src: any, obj: any) => {
  const customizer = (objValue: any, srcValue: any) => {
    if (isArray(objValue)) {
      return srcValue;
    }
  };
  return mergeWith(cloneDeep(src), obj, customizer);
};

export const readJson = (jsonPath: string) => {
  if (!existsSync(jsonPath)) {
    return {};
  }
  const jsonStr = readFileSync(jsonPath, {
    encoding: 'utf8',
  });
  try {
    return jsonParse(jsonStr);
  } catch (error) {
    throw Error(`读取 JSON 失败，请检查 JSON 格式：${jsonPath}`);
  }
};

export const upperCaseFirst = (str: string) =>
  str.replace(str[0], str[0].toUpperCase());

export const lowerCaseFirst = (str: string) =>
  str.replace(str[0], str[0].toLowerCase());

// change date formate to：2012_12_11
export const getDateString = (date: Date) =>
  `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;

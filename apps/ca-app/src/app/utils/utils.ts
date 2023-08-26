import { isObject, isEmpty } from 'lodash';

export const removeEmptyKeys = <T = any>(myObj: any): T => {
  let obj = { ...myObj };

  for (const propName in obj) {
    if (
      obj[propName] === null ||
      obj[propName] === undefined ||
      (Array.isArray(obj[propName]) && !obj[propName].length) ||
      (isObject(obj[propName]) && isEmpty(obj[propName]))
    ) {
      delete obj[propName];
    } else if (!Array.isArray(obj[propName]) && isObject(obj[propName]) && !isEmpty(obj[propName])) {
      obj[propName] = removeObjectEmptyKeys(obj[propName]);
      if (isEmpty(obj[propName])) {
        delete obj[propName];
      }
    }
  }

  return obj;
};

export const isToday = (value: any): boolean => {
  const inputDate = new Date(value);
  const todayDate = new Date();
  return inputDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0);
};

export const removeObjectEmptyKeys = (obj: any): Object => {
  const object = { ...obj };

  for (const subObj in object) {
    if (isObject(object[subObj]) && isEmpty(object[subObj])) {
      delete object[subObj];
    } else if (!Array.isArray(object[subObj]) && isObject(object[subObj]) && !isEmpty(object[subObj])) {
      object[subObj] = removeObjectEmptyKeys(object[subObj]);
      if (isEmpty(object[subObj])) {
        delete object[subObj];
      }
    }
  }

  return object;
};

export const isEmptyValue = (obj: any) => {
  if (typeof obj === 'object') {
    return !Object.keys(obj).length;
  }
  return !obj;
};

export const extend = Object.assign;

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};
export const hasChange = (val, newValue) => {
  return !Object.is(val, newValue);
};
export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
//val 调用Object 方法

//   TPP
//  先去写一个特定的行为 =》 重构成通用的行为
// add => Add
//   add-foo => addFoo
export const camelize = (str: any) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

import { camelize, capitalize } from "../shared/index";

export function emit(instance, event, ...args) {
  console.log("emit", event);

  //instance.props => event
  const { props } = instance;

  const toHandleKey = (str: string) => {
    return str ? "on" + capitalize(str) : "";
  };

  const handlerName = toHandleKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}

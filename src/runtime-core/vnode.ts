import { ShapeFlags } from "../shared/ShapeFlags";
export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    ShapeFlag: getShapeFlag(type),
    el: null,
  };
  // children
  if (typeof children === "string") {
    // vnode.ShapeFlags = ShapeFlags.TEXT_CHILDREN | ShapeFlags.TEXT_CHILDREN;
    vnode.ShapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.ShapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  // 组件 + children object
  if (vnode.ShapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.ShapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}

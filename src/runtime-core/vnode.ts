import { ShapeFlags } from "../shared/ShapeFlags";
/* 组件可以没有根标签，内部会将多个标签包含在一个Fragment虚拟元素中
  好处：减少标签层级，减少内存占用
*/
export const Fragment = Symbol("Fragment"); //碎片化节点
export const Text = Symbol("Text");

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    component: null,
    key: props && props.key,
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

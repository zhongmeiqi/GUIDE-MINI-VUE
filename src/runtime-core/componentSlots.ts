import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  // children => object
  //   instance.slots = Array.isArray(children) ? children : [children];
  const { vnode } = instance;
  if (vnode.ShapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSLots(children, instance.slots);
  }
}
function normalizeObjectSLots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}

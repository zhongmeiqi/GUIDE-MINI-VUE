import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicinstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
  console.log(11 + parent);
  const component = {
    vnode, //更新之前的 节点
    type: vnode.type,
    next: null, //下次要更新的虚拟节点
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  // TODO
  //initSlots
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  // 设置状态组件
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance: any) {
  const Component = instance.vnode.type;

  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;
  if (setup) {
    currentInstance = instance;
    // function Object
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    currentInstance = null;

    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult: any) {
  // TODO function
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render;
}
let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

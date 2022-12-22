import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;
  function render(vnode, container) {
    patch(null, vnode, container, null);
  }
  // n1:老的节点
  // n2:新的节点
  function patch(n1, n2, container, parentComponent) {
    //  处理组件
    //判断 是不是 element()
    // processElement();
    const { type, ShapeFlag } = n2;
    // Fragement 只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
      default:
        if (ShapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (ShapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }
  function processText(n1, n2, container) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }
  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }
  function mountComponent(initialVNode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }
  function setupRenderEffect(instance: any, initialVNode, container) {
    effect(() => {
      if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        console.log(subTree);
        // vnode=>patch
        // vnode =>element => mountElement(挂载element)
        patch(null, subTree, container, instance);
        // element =>mount 所有element都处理完之后
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTree;
        console.log("current", subTree);
        console.log("prev", prevSubTree);
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  function processElement(n1, n2, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }
  function patchElement(n1, n2, container) {
    console.log("n1", n1);
    console.log("n2", n2);
    console.log("patchElement");
    // prop
    // Children
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    /*     const el = document.createElement("div")
    // string array
    el.textContent="hi mini-vue"
    el.setAttribute('id',"root")
    document.body.append(el) */

    // vnode => element => div

    // canvas
    // new Element
    const el = (vnode.el = createElement(vnode.type));
    // string array
    const { children, ShapeFlag } = vnode;
    if (ShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // vnode
      mountChildren(vnode, el, parentComponent);
    }

    // props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      // 具体的click => 通用
      // on + event.name
      // onMousedown
      /*     const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const event = key.slice(2).toLocaleLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    } */
      patchProp(el, key, val);
    }
    // canvas el.x =10; addChild()
    // container.append(el);
    insert(el, container);
  }
  // rollup用于 库的打包；webpack 应用的打包
  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}

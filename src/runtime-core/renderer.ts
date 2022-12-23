import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppAPI } from "./createApp";
import { queueJobs } from "./scheduler";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProps, insert, remove, setElementText } = options;
  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }
  // n1:老的节点
  // n2:新的节点
  function patch(n1, n2, container, parentComponent, anchor) {
    //  处理组件
    //判断 是不是 element()
    // processElement();
    const { type, ShapeFlag } = n2;
    // Fragement 只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
      default:
        if (ShapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (ShapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }

    function processText(n1, n2, container) {
      const { children } = n2;
      const textNode = (n2.el = document.createTextNode(children));
      container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
      mountChildren(n2, container, parentComponent, anchor);
    }

    function processComponent(n1, n2, container, parentComponent, anchor) {
      if (!n1) {
        mountComponent(n2.children, container, parentComponent, anchor);
      } else {
        updateComponent(n1, n2);
      }
    }
    function updateComponent(n1, n2) {
      /* 
      1、更新组件的数据 （props）
      2、调用组件的render函数 (利用effect返回的render，再调用render执行更新逻辑)
      3、更新前检测一下需不需要更新 （检测组件的props）
      */
      const instance = (n2.component = n1.component);
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      } else {
        n2.el = n1.el;
        n2.vnode = n2;
      }
    }
    function mountComponent(
      initialVNode: any,
      container,
      parentComponent,
      anchor
    ) {
      const instance = (initialVNode.component = createComponentInstance(
        initialVNode,
        parentComponent
      ));

      setupComponent(instance);
      setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance: any, initialVNode, container, anchor) {
      instance.update = effect(
        () => {
          if (!instance.isMounted) {
            console.log("init");
            const { proxy } = instance;
            const subTree = (instance.subTree = instance.render.call(proxy));
            console.log(subTree);
            // vnode=>patch
            // vnode =>element => mountElement(挂载element)
            patch(null, subTree, container, instance, anchor);
            // element =>mount 所有element都处理完之后
            initialVNode.el = subTree.el;
            instance.isMounted = true;
          } else {
            console.log("update");

            // 需要一个 vnode
            const { next, vnode } = instance;
            if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance, next);
            }

            const { proxy } = instance;
            const subTree = instance.render.call(proxy);
            const prevSubTree = instance.subTree;
            instance.subTree = subTree;
            console.log("current", subTree);
            console.log("prev", prevSubTree);
            patch(prevSubTree, subTree, container, instance, anchor);
          }
        },
        {
          scheduler() {
            console.log("update--scheduler");
            queueJobs(instance.update);
          },
        }
      );
    }
    return {
      createApp: createAppAPI(render),
    };
  }
  function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
  }

  function processElement(n1, n2, container: any, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("n1", n1);
    console.log("n2", n2);
    console.log("patchElement");

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProp(el, oldProps, newProps);

    // prop
    // Children
  }
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.ShapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1、把老的 children 清空
        unmountChildren(n1.children);
      }
      if (c1 !== c2) {
        debugger;
        setElementText(container, c2);
      }
    } else {
      // new array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        setElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }
  // c1:老节点 c2:新节点
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    function isSameVNodeType(n1, n2) {
      // type
      // key
      return n1.type === n2.type && n1.key === n2.key;
    }
    // 左侧相同
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 右侧相同
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 3、新的比老的多 创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      } else if (i > e2) {
        // 4、老的比新的长 删除
        while (i <= e1) {
          remove(c1[i].el);
          i++;
        }
      } else {
        // 5、中间对比
        let s1 = i; //老节点的开始
        let s2 = i;

        const toBePatched = e2 - s2 + 1; //要处理的节点总数量
        let patched = 0;
        const keyToNewIndexMap = new Map();
        const newIndexToOldIndexMap = new Array(toBePatched);
        let moved = false;
        let maxNewIndexSoFar = 0;

        // 还未初始化（未建立映射关系）
        for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

        for (let i = s2; i < e2; i++) {
          const nextChild = c2[i];
          keyToNewIndexMap.set(nextChild.key, i);
        }

        for (let i = s1; i <= e1; i++) {
          const prevChild = c1[i];
          if (patched >= toBePatched) {
            remove(prevChild.el);
            continue;
          }

          let newIndex;
          if (prevChild.key !== null) {
            newIndex = keyToNewIndexMap.get(prevChild.key);
          } else {
            for (let j = s2; j <= e2; j++) {
              if (isSameVNodeType(prevChild, c2[j])) {
                newIndex = j;
                break;
              }
            }
          }
          if (newIndex === undefined) {
            remove(prevChild.el);
          } else {
            if (newIndex >= maxNewIndexSoFar) {
              maxNewIndexSoFar = newIndex;
            } else {
              moved = true;
            }
            newIndexToOldIndexMap[newIndex - s2] = i + 1;
            patch(prevChild, c2[newIndex], container, parentComponent, null);
            patched++;
          }
        }

        const increasingNewIndexSquence = moved
          ? getSequence(newIndexToOldIndexMap)
          : [];
        // j:最长递增子序列的 指针
        /*  let j = 0;
        for (let i = 0; i < toBePatched; i++) {
          if (i !== increasingNewIndexSquence[j]) {
            console.log("移动位置");
          } else {
            j++;
          }
        } */
        // 倒序
        let j = increasingNewIndexSquence.length - 1;
        for (let i = toBePatched - 1; i >= 0; i--) {
          const nextIndex = i + s2;
          const nextChild = c2[nextIndex];
          const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

          if (newIndexToOldIndexMap[i] === 0) {
            patch(null, nextChild, container, parentComponent, anchor);
          } else if (moved) {
            if (j < 0 || i !== increasingNewIndexSquence[j]) {
              console.log("移动位置");
              insert(nextChild.el, container, anchor);
            } else {
              j--;
            }
          }
        }
      }
    }

    console.log(i);
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove
      remove(el);
    }
  }

  const EMPTY_OBJ = {};
  function patchProp(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          patchProps(el, key, prevProp, nextProp);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            patchProps(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
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
      mountChildren(vnode.children, el, parentComponent, anchor);
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
      patchProps(el, key, null, val);
    }
    // canvas el.x =10; addChild()
    // container.append(el);
    insert(el, container);
  }

  // rollup用于 库的打包；webpack 应用的打包
  function mountChildren(children, container, parentComponent, anchor) {
    children.children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }
}

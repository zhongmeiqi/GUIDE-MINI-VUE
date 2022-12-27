'use strict';

/* 组件可以没有根标签，内部会将多个标签包含在一个Fragment虚拟元素中
  好处：减少标签层级，减少内存占用
*/
const Fragment = Symbol("Fragment"); //碎片化节点
const Text = Symbol("Text");
function createVNode(type, props, children) {
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
        vnode.ShapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.ShapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.ShapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.ShapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        // function
        if (typeof slot === "function") {
            // children 是不可以有 array
            // 只需要渲染 children
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const isString = (value) => {
    return typeof value === "string";
};
const hasChange = (val, newValue) => {
    return !Object.is(val, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
//val 调用Object 方法
//   TPP
//  先去写一个特定的行为 =》 重构成通用的行为
// add => Add
//   add-foo => addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        // 1、会收集依赖
        // shouldTrack 来做区分
        if (!this.active) {
            return this._fn();
        }
        // 应该收集
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        //reset
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
    onStop() {
        throw new Error("Method not implemented.");
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    //target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
    //已经在dep中
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
    //   const dep = new Set();
}
function trackEffect(dep) {
    // 看看 dep之前有没有添加过，添加过的话，那就不添加了
    if (dep.has(activeEffect))
        return;
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    depsMap.get(key);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        effect.run();
    }
}
function effect(fn, options = {}) {
    // fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // Object.assign(_effect, options);
    //extend
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        console.log(key);
        if (key === "_v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandles = {
    readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key}set 失败，因为 target 是 readonly`, target);
        return true;
    },
};
const shallowReadonlyHadlers = extend({}, readonlyHandles, {
    get: shallowReadonly,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandles);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHadlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target:${target}必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this._v_isRef = true;
        this._rawValue = value;
        // 看看value是不是对象
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        if (isTracking()) {
            trackEffect(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        // 一定是先去修改了value的值，然后再进行通知
        // hasChange
        if (hasChange(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref._v_isRef;
}
function unRef(ref) {
    //看看是不是ref  是ref.value
    //不是，ref(值本身)
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

function emit(instance, event, ...args) {
    console.log("emit", event);
    //instance.props => event
    const { props } = instance;
    const toHandleKey = (str) => {
        return str ? "on" + capitalize(str) : "";
    };
    const handlerName = toHandleKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // key===$el
        // if (key === "$el") {
        //   return instance.vnode.el;
        // }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    // children => object
    //   instance.slots = Array.isArray(children) ? children : [children];
    const { vnode } = instance;
    if (vnode.ShapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSLots(children, instance.slots);
    }
}
function normalizeObjectSLots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    console.log(11 + parent);
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    //initSlots
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 设置状态组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
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
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    // 存
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.providers;
        // init 设置 prototype
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps) {
            return true;
        }
    }
    return false;
}

// import { render } from "./renderer";
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转成vnode,
                // component => vnode
                // 所有的逻辑操作都会基于 vnode做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

const queue = [];
const p = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
/* 创造 一个队列 */
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
/* 同步变成异步
   微任务的时候执行job()
*/
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
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
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
            default:
                if (ShapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (ShapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
        function processText(n1, n2, container) {
            const { children } = n2;
            const textNode = (n2.el = document.createTextNode(children));
            container.append(textNode);
        }
        function processFragment(n1, n2, container, parentComponent, anchor) {
            mountChildren(n2, container, parentComponent);
        }
        function processComponent(n1, n2, container, parentComponent, anchor) {
            if (!n1) {
                mountComponent(n2.children, container, parentComponent);
            }
            else {
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
            }
            else {
                n2.el = n1.el;
                n2.vnode = n2;
            }
        }
        function mountComponent(initialVNode, container, parentComponent, anchor) {
            const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
            setupComponent(instance);
            setupRenderEffect(instance, initialVNode, container);
        }
        function setupRenderEffect(instance, initialVNode, container, anchor) {
            instance.update = effect(() => {
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
                }
                else {
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
                    patch(prevSubTree, subTree, container, instance);
                }
            }, {
                scheduler() {
                    console.log("update--scheduler");
                    queueJobs(instance.update);
                },
            });
        }
    }
    return {
        createApp: createAppAPI(render),
    };
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("n1", n1);
        console.log("n2", n2);
        console.log("patchElement");
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProp(el, oldProps, newProps);
        // prop
        // Children
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.ShapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1、把老的 children 清空
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                debugger;
                hostSetElementText(container, c2);
            }
        }
        else {
            // new array
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent);
            }
        }
    }
    // c1:老节点 c2:新节点
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
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
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧相同
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 3、新的比老的多 创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent);
                    i++;
                }
            }
            else if (i > e2) {
                // 4、老的比新的长 删除
                while (i <= e1) {
                    hostRemove(c1[i].el);
                    i++;
                }
            }
            else {
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
                for (let i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                for (let i = s2; i < e2; i++) {
                    const nextChild = c2[i];
                    keyToNewIndexMap.set(nextChild.key, i);
                }
                for (let i = s1; i <= e1; i++) {
                    const prevChild = c1[i];
                    if (patched >= toBePatched) {
                        hostRemove(prevChild.el);
                        continue;
                    }
                    let newIndex;
                    if (prevChild.key !== null) {
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    else {
                        for (let j = s2; j <= e2; j++) {
                            if (isSameVNodeType(prevChild, c2[j])) {
                                newIndex = j;
                                break;
                            }
                        }
                    }
                    if (newIndex === undefined) {
                        hostRemove(prevChild.el);
                    }
                    else {
                        if (newIndex >= maxNewIndexSoFar) {
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            moved = true;
                        }
                        newIndexToOldIndexMap[newIndex - s2] = i + 1;
                        patch(prevChild, c2[newIndex], container, parentComponent);
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
                        patch(null, nextChild, container, parentComponent);
                    }
                    else if (moved) {
                        if (j < 0 || i !== increasingNewIndexSquence[j]) {
                            console.log("移动位置");
                            hostInsert(nextChild.el, container, anchor);
                        }
                        else {
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
            hostRemove(el);
        }
    }
    const EMPTY_OBJ = {};
    function patchProp(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        /*     const el = document.createElement("div")
        // string array
        el.textContent="hi mini-vue"
        el.setAttribute('id',"root")
        document.body.append(el) */
        // vnode => element => div
        // canvas
        // new Element
        const el = (vnode.el = hostCreateElement(vnode.type));
        // string array
        const { children, ShapeFlag } = vnode;
        if (ShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (ShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // vnode
            mountChildren(vnode.children, el, parentComponent);
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
            hostPatchProp(el, key, null, val);
        }
        // canvas el.x =10; addChild()
        // container.append(el);
        hostInsert(el, container);
    }
    // rollup用于 库的打包；webpack 应用的打包
    function mountChildren(children, container, parentComponent, anchor) {
        children.children.forEach((v) => {
            patch(null, v, container, parentComponent);
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
                    }
                    else {
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

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevVal, nextVal) {
    console.log(`PatchProp 设置属性:${key} 值:${nextVal}`);
    console.log(`key: ${key} 之前的值是:${prevVal}`);
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key, nextVal);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    if (parent) {
        // parent.append(el);
        parent.insertBefore(child, anchor || null);
    }
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
  __proto__: null,
  renderer: renderer,
  createApp: createApp,
  h: h,
  renderSlots: renderSlots,
  createTextVNode: createTextVNode,
  getCurrentInstance: getCurrentInstance,
  registerRuntimeCompiler: registerRuntimeCompiler,
  provide: provide,
  inject: inject,
  createRenderer: createRenderer,
  nextTick: nextTick
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    /* let code = "";
    code += "return";
    const VueBinging = "Vue";
  
    const aliaHelper = (s) => `${s}:_${s}`;
    push(`const { ${ast.helpers.map(aliaHelper).join(",")} } = ${VueBinging}`);
    push("\n");
    push("return ");
  
     preamble:前导码 */
    getFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    /* signature:签名 */
    const signature = args.join(",");
    //   code += `function ${functionName}(${signature}){`;
    push(`function ${functionName}(${signature}){`);
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        /*   code: `return function render(_ctx,_cache,$props,$setup,$data,$options){
                return "hi"
            }`, */
        code: context.code,
    };
}
function getFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliaHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliaHelper).join(", ")}} = ${VueBinging}`);
    }
    push("\n");
    push("return ");
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            getExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            getCompoundExpression(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function getExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    /*  for (let i = 0; i < children.length; i++) {
      const child = children[i];
      genNode(child, context);
    } */
    genNodeList(genNullable([tag, props, children]), context);
    genNode(children, context);
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < node.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function getCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function createParserContext(content) {
    return {
        source: content,
    };
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (startsWith(s, "{{")) {
            // 看看如果是 {{ 开头的话，那么就是一个插值， 那么去解析他
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (s[1] === "/") {
                // 这里属于 edge case 可以不用关心
                // 处理结束标签
                if (/[a-z]/i.test(s[2])) {
                    // 匹配 </div>
                    // 需要改变 context.source 的值 -> 也就是需要移动光标
                    parseTag(context, 1 /* TagType.End */);
                    // 结束标签就以为这都已经处理完了，所以就可以跳出本次循环了
                    continue;
                }
            }
            else if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 检测标签的节点
    // 如果是结束标签的话，需要看看之前有没有开始标签，如果有的话，那么也应该结束
    // 这里的一个 edge case 是 <div><span></div>
    // 像这种情况下，其实就应该报错
    const s = context.source;
    if (context.source.startsWith("</")) {
        // 从后面往前面查
        // 因为便签如果存在的话 应该是 ancestors 最后一个元素
        for (let i = ancestors.length - 1; i >= 0; --i) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true;
            }
        }
    }
    // 看看 context.source 还有没有值
    return !context.source;
}
function parseElement(context, ancestors) {
    // 应该如何解析 tag 呢
    // <div></div>
    // 先解析开始 tag
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element);
    const children = parseChildren(context, ancestors);
    ancestors.pop();
    // 解析 end tag 是为了检测语法是不是正确的
    // 检测是不是和 start tag 一致
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺失结束标签：${element.tag}`);
    }
    element.children = children;
    return element;
}
function startsWithEndTagOpen(source, tag) {
    // 1. 头部 是不是以  </ 开头的
    // 2. 看看是不是和 tag 一样
    return (startsWith(source, "</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 发现如果不是 > 的话，那么就把字符都收集起来 ->div
    // 正则
    const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
    const tag = match[1];
    // 移动光标
    // <div
    advanceBy(context, match[0].length);
    // 暂时不处理 selfClose 标签的情况 ，所以可以直接 advanceBy 1个坐标 <  的下一个就是 >
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    let tagType = 0 /* ElementTypes.ELEMENT */;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        tagType,
    };
}
function parseInterpolation(context) {
    // 1. 先获取到结束的index
    // 2. 通过 closeIndex - startIndex 获取到内容的长度 contextLength
    // 3. 通过 slice 截取内容
    // }} 是插值的关闭
    // 优化点是从 {{ 后面搜索即可
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // TODO closeIndex -1 需要报错的
    // 让代码前进2个长度，可以把 {{ 干掉
    advanceBy(context, 2);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = context.source.slice(0, rawContentLength);
    const preTrimContent = parseTextData(context, rawContent.length);
    const content = preTrimContent.trim();
    // 最后在让代码前进2个长度，可以把 }} 干掉
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function parseText(context) {
    // endIndex 应该看看有没有对应的 <
    // 比如 hello</div>
    // 像这种情况下 endIndex 就应该是在 o 这里
    // {
    const endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // endIndex > index 是需要要 endIndex 尽可能的小
        // 比如说：
        // hi, {{123}} <div></div>
        // 那么这里就应该停到 {{ 这里，而不是停到 <div 这里
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    // 1. 直接返回 context.source
    // 从 length 切的话，是为了可以获取到 text 的值（需要用一个范围来确定）
    const rawText = context.source.slice(0, length);
    // 2. 移动光标
    advanceBy(context, length);
    return rawText;
}
function advanceBy(context, numberOfCharacters) {
    context.source = context.source.slice(numberOfCharacters);
}
function createRoot(children) {
    return {
        type: 4 /* NodeTypes.ROOT */,
        children,
        helpers: [],
    };
}
function startsWith(source, searchString) {
    return source.startsWith(searchString);
}

/* ast的增删改查 */
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1、遍历-深度优先搜索
    traverseNode(root, context);
    // 2、修改text content
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    /* if (node.type === NodeTypes.TEXT) {
      node.content = node.content + "mini-vue";
    } */
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            //中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// mini-vue 出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);
/* function renderFunction(Vue) {
  const {
    toDisplayString: _toDisplayString,
    openBlock: _openBlock,
    createElementBlock: _createElementBlock,
  } = Vue;
  return function render(_ctx, _cache, $props, $setup, $data, $options) {
    return (
      _openBlock(),
      _createElementBlock("div", null, "hi, " + _toDisplayString(_ctx.message))
    );
  };
} */
// cjs =>main
// esm => module
// ShapeFlags 用来判断VNode类型
// VNode => flag

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.renderer = renderer;

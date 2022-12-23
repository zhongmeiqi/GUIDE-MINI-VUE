const Fragment = Symbol("Fragment");
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
const hasChange = (val, newValue) => {
    return !Object.is(val, newValue);
};

const targetMap = new Map();
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

let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}

function provide(key, value) {
}
function inject(key, defaultValue) {
}

const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}

function createRenderer(options) {
}

const renderer = createRenderer();
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, renderSlots, renderer };

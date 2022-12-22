import { hasChange, isObject } from "../shared";
import { trackEffect, triggerEffects, isTracking } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;
  public _v_isRef = true;

  constructor(value) {
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

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref._v_isRef;
}

export function unRef(ref) {
  //看看是不是ref  是ref.value
  //不是，ref(值本身)
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}

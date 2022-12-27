// mini-vue 出口
// export * from "./runtime-core";
export * from "./runtime-dom"; //Vue

import { baseCompile } from "./complier-core";
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

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

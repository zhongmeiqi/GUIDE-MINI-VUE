
import {h,getCurrentInstance} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

export const App = {
    name:'App',
    // template 最终也会被编译成 render 函数
    render(){
       return h("div",{},[h("p",{},"currentInstance demo"),h(Foo)])
    },
    setup(){
        // comporition API
      const instance = getCurrentInstance();
      console.log("App:",instance)
    }
}
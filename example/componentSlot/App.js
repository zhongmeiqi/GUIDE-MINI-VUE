
import {h} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

export const App = {
    name:'App',
    // template 最终也会被编译成 render 函数
    render(){
        const app = h("div",{},"App");
        // Object key
        const foo = h(Foo,{},
            {header:({age})=>[h("p",{},"header"+age)],footer:()=>h("p",{},'footer')}
            ); 

        // 兼容 数组 、vnode
        return h("div",{},[app,foo])
    },
    setup(){
        // comporition API
        return{
        }
    }
}

import {h} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

window.self = null
export const App = {
    name:'App',
    // template 最终也会被编译成 render 函数
    render(){
        window.self = this
        return h("div",{
            id:"root",
            class:["red","hard"],
            onClick(){
                console.log('click')
            },
            onMousedown(){
                console.log('mousedown')
            },
        },
        [h("div",{},"hi,"+this.msg),h(Foo,{count:1})]
        // setupState
        // this.$el =>get root element
        // "hi, "+this.msg
        // string
        // "hi,mini-vue"
        // Array
        // [h("p",{class:"red"},"hi"),h("p",{class:"blue"},"mini-vue")]
        );
    },
    setup(){
        // comporition API
        return{
            msg:"mini-vuehaha"
        }
    }
}
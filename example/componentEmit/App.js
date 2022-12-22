
import {h} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

export const App = {
    name:'App',
    // template 最终也会被编译成 render 函数
    render(){
        // emit
        return h("div",{},[h("div",{},"App"),h(Foo,{
            // on + Event
            onAdd(a,b){
                console.log("onAdd",a,b)
            },
            // add-foo => addFoo
            onAddFoo(){
                console.log("onAddFoo",)
            }
        })])
        ;
    },
    setup(){
        // comporition API
        return{
        }
    }
}
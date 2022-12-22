
import {h,getCurrentInstance} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

export const App = {
    name:'App',
    // template 最终也会被编译成 render 函数
    render(){
       return h("rect",{x:this.x,y:this.y})
    },
    setup(){
      return {
        x:100,
        y:100
      }
    }
}
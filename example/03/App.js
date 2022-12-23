
import {h,ref} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

export const App = {
    name:'App',
    setup(){
        // comporition API
      const count = ref(0);

      const onClick = ()=>{
        count.value++
      };
      return {
        count,
        onClick,
      }
    },
    render(){
      console.log(this.count)
      return h("div",{
        id:"root",
      },[
        h("div",{},"count:"+this.count),// 收集依赖
        h("button",{
          onClick:this.onClick,
        },"click")
      ])
    }
}

import {h,ref,getCurrentInstance,nextick} from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js";

export const App = {
    name:'App',
    setup(){
        // comporition API
      const count = ref(1);
      const instance = getCurrentInstance()

      function onClick(){
        for(let i =0;i<100;i++){
          console.log("update");
          count.value=i;
        }
        console.log(instance)
        /* 获取更新完成后的视图的数据 */
        nextick(()=>{
          console.log(instance)
        })
       /*  await nextick()
        console.log(instance) */
      };
      return {
        count,
        onClick,
      }
    },
    render(){
    const button = h("button",{onClick:this.onClick},"update")
    const p = h("p",{},"count:"+this.count);

    return h("div",{}[button,p])
    }
}
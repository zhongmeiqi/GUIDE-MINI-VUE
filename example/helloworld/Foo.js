import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
    setup(props){
        console.log(props)
        // props 是shallowreadonly
        // props.count++
    },
    render(){
        return h("div",{},"foo:"+this.count)
    }
}
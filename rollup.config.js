
import typescript from "@rollup/plugin-typescript"
export default{
    input:'src/index.ts',
    output:[
        //1、cjs => common.js(node.js规范)
        //2、esm 
        {
            format:'cjs',
            file:'lib/guide-mini-vue.cjs.js'
        },{
            format:"es",
            file:"lib/guide-mini-vue.esm.js"
        },
    ],
    // npm @rollup/plugin-typescript
    plugins:[typescript()]
}
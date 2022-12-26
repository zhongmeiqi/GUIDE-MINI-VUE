import { NodeTypes } from "./ast";

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;
  /* let code = "";
  code += "return"; 
  const VueBinging = "Vue";

  const aliaHelper = (s) => `${s}:_${s}`;
  push(`const { ${ast.helpers.map(aliaHelper).join(",")} } = ${VueBinging}`);
  push("\n");
  push("return ");

   preamble:前导码 */
  getFunctionPreamble(ast, context);
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  /* signature:签名 */
  const signature = args.join(",");
  console.log(ast);

  //   code += `function ${functionName}(${signature}){`;
  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");

  return {
    /*   code: `return function render(_ctx,_cache,$props,$setup,$data,$options){
            return "hi"
        }`, */
    code: context.code,
  };
}
function getFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";
  const aliaHelper = (s) => `${s}:_${s}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliaHelper).join(", ")}} = ${VueBinging}`);
  }
  push("\n");
  push("return ");
}
function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
  };
  return context;
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      getExpression(node, context);
      break;
    default:
      break;
  }
}
function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}
function genInterpolation(node, context) {
  const { push } = context;
  push(`_toDisplayString(`);
  genNode(node.content, context);
  push(")");
}
function getExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}

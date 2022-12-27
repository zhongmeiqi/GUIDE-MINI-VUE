import { isString } from "../../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";

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
  const aliaHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
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
    helper(key) {
      return `_${helperMapName[key]}`;
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
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      getCompoundExpression(node, context);
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
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}
function getExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}
function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  /*  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    genNode(child, context);
  } */
  genNodeList(genNullable([tag, props, children]), context);
  genNode(children, context);
  push(")");
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }
    if (i < node.length - 1) {
      push(", ");
    }
  }
}
function genNullable(args) {
  return args.map((arg) => arg || "null");
}
function getCompoundExpression(node, context) {
  const { push } = context;
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

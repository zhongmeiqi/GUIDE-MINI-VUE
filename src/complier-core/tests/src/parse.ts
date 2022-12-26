import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
  let nodes: any = [];
  const s = context.source;

  while (!isEnd(context, ancestors)) {
    let node;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        console.log(context);
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
const enum TagType {
  Start,
  End,
}
function parseText(context) {
  /*  // 1、获取content
  const content = context.source.slice(0, context.source.length);

  // 2、推进
  advanceBy(context, content.length); */
  let endIndex = context.source.length;
  let endToken = ["{{", "<"];
  for (let i = 0; i < endToken.length; i++) {
    const index = context.source.indexOf(endToken);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

function parseElement(context, ancestors) {
  // Implement:实施
  // 1、解析 tag
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签：${element.tag}`);
  }
  return element;
}
function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  console.log(match);
  const tag = match[1];
  // 2、删除处理完成的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ElEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  // {{message}}
  //   delimiter:分隔符
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  /* 推进 */
  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  const rawContent = parseTextData(context, rawContentLength);

  const content = rawContent.trim();

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParserContext(content: string): any {
  return {
    source: content,
  };
}
function isEnd(context, ancestors) {
  // 1、source有值的时候

  // 2、当遇到结束标签的时候
  const s = context.source;
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  /*   if (ancestors && s.startsWith(`</${ancestors}>`)) {
    return true;
  } */

  return !s;
}

import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, ""));
}
function parseChildren(context, parentTag) {
  let nodes: any = [];
  const s = context.source;

  while (!isEnd(context, parentTag)) {
    let node;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context);
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
  let endToken = "{{";
  const index = context.source.indexOf(endToken);
  if (index !== -1) {
    endIndex = index;
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

function parseElement(context) {
  // Implement:实施
  // 1、解析 tag
  const element: any = parseTag(context, TagType.Start);
  element.children = parseChildren(context, element.tag);
  parseTag(context, TagType.End);
  return element;
}
function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);

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
function isEnd(context, parentTag) {
  // 1、source有值的时候

  // 2、当遇到结束标签的时候
  const s = context.source;
  if (parentTag && s.startsWith(`</${parentTag}>`)) {
    return true;
  }

  return !s;
}

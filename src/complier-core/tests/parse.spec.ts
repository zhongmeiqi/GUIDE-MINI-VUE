import { NodeTypes } from "./src/ast";
import { baseParse } from "./src/parse";

describe("Parse", () => {
  describe("interpolation", () => {
    test("simple interpolation", () => {
      const ast = baseParse("{{ message }}");
      //  root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION, //插值，插入文字
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });
  describe("element", () => {
    it("simple element div", () => {
      const ast = baseParse("<div></div>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ElEMENT,
        tag: "div",
        children: [],
      });
    });
  });
  describe("text", () => {
    it("simple text", () => {
      const ast: any = baseParse("some text");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text",
      });
    });
  });
  /* test("hello world", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");

    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ElEMENT,
      tag: "div",
      children: [
        { type: NodeTypes.TEXT, content: "hi," },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  }); */
  test("should throw error when lack end tag", () => {
    expect(() => {
      baseParse("<div><span></div>");
    }).toThrow();
  });
});

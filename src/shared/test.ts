const ShapeFlags = {
  element: 0,
  stateful_component: 0,
  text_children: 0,
  array_children: 0,
};
// 1、可以设置 修改
// ShapeFlags.stateful_component = 1;
// ShapeFlags.array_children = 1;

// 2、查找
// if(ShapeFlags.element)
// if(ShapeFlags.stateful_component)

// 3、不够高效 => 位运算的方式来
// 0000
// 0001 => ShapeFlags.element
// 0010 => ShapeFlags.stateful_component
// 0100 => ShapeFlags.text_children
// 1000 =>ShapeFlags.array_children

// 1010 => ShapeFlags.array_children & ShapeFlags.stateful_component

// 修改 | 或运算符
// 0000  | 0001 =》 0001

// 查找 &
// 0001 & 0001 =》 0001
// 0010 & 0001 =》 0000

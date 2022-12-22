import { effect, stop } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextage;
    effect(() => {
      nextage = user.age + 1;
    });

    //update
    user.age++;
    expect(nextage).toBe(12);
  });

  //1、通过effect 的第二个参数给定的一个 scheduler 的fn
  //2、effect 第一次执行的时候 还会执行 fn
  //3、 当响应式对象 set update 不会执行fn 而是执行 scheduler
  //4、如果说当执行 runner 的时候，会再次执行 fn
  it("should return runner when call effect", () => {
    //1.effect(fn) ->function(runner) ->fn -> return
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    obj.prop++;

    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});

import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
    //1、缓存
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });
    expect(age.value).toBe(1);
  });
});

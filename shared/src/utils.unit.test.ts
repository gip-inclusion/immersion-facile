import { expectToEqual } from "./test.helpers";
import { objectToDependencyList } from "./utils";

describe("utils", () => {
  it("objectToDependencyList", () => {
    const object = {
      a: [1, 2],
      b: [3, 4],
      c: "truc",
      d: null,
      e: {
        f: [5, 6],
        g: {
          h: [7, 8],
          i: undefined,
        },
      },
    };

    const list = objectToDependencyList(object);

    expectToEqual(list, [
      "[1,2]",
      "[3,4]",
      "truc",
      "null",
      '{"f":[5,6],"g":{"h":[7,8]}}',
    ]);
  });
});

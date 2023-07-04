import { expectToEqual } from "./test.helpers";
import { sortByProperty } from "./utils";

describe("utils", () => {
  it("sortByProperty", () => {
    const list = [
      { month: "janvier" },
      { month: "février" },
      { month: "mars" },
    ];

    const sortedList = sortByProperty("month")(list);

    expectToEqual(sortedList, [
      { month: "février" },
      { month: "janvier" },
      { month: "mars" },
    ]);
  });
});

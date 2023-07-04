import { expectToEqual } from "./test.helpers";
import { sortByPropertyCaseInsensitive } from "./utils";

describe("utils", () => {
  it("sortByProperty", () => {
    const list = [
      { month: "janvier" },
      { month: "février" },
      { month: "mars" },
    ];

    const sortedList = sortByPropertyCaseInsensitive("month")(list);

    expectToEqual(sortedList, [
      { month: "février" },
      { month: "janvier" },
      { month: "mars" },
    ]);
  });
});

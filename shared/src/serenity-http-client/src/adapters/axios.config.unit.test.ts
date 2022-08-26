import { isValidErrorResponse } from "./axios.config";

describe("Error Response format standart", () => {
  it.each([
    [null, false],
    ["plop", false],
    [{}, false],
    [
      {
        request: { status: "plop" },
      },
      false,
    ],
    [[], false],
    [[{}], false],
    [{}, false],
    [
      {
        data: "",
        status: 400,
      },
      true,
    ],
    [
      {
        data: "plop",
        status: 400,
      },
      true,
    ],
    [
      {
        data: {
          prop: "A nested property",
        },
        status: 400,
      },
      true,
    ],
  ])(
    "isAxiosResponse should detect if the response has a valid response structure code, expect: (%s to be %s)",
    (raw: any, expected: boolean) => {
      expect(isValidErrorResponse(raw)).toBe(expected);
    },
  );
});

import axios from "axios";
import { isValidAxiosErrorResponse } from "./axios.port";

describe("Error Response format", () => {
  it.each([
    [{ response: {} }, false],
    [
      {
        isAxiosError: false,
      },
      false,
    ],
    [
      {
        isAxiosError: true,
      },
      true,
    ],
    [
      {
        response: {
          status: 400,
        },
        isAxiosError: true,
      },
      true,
    ],
  ])(
    "isAxiosError should detect if the response has a valid format, expect: (%s to be %s)",
    (raw: any, expected: boolean) => {
      expect(axios.isAxiosError(raw)).toBe(expected);
    },
  );

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
      expect(isValidAxiosErrorResponse(raw)).toBe(expected);
    },
  );
});

import axios from "../../../../node_modules/axios";

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
});

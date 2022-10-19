import { queryParamsAsString } from "shared";

describe("QueryParams utils", () => {
  it("should return empty string when param array is empty", () => {
    const queryParams = {};

    expect(queryParamsAsString(queryParams)).toBe("");
  });

  it("should return a simple string following the pattern 'key=encodedUriValue' when param array has a single value", () => {
    const queryParams = {
      message: "I like turtles",
    };

    expect(queryParamsAsString(queryParams)).toBe("message=I%20like%20turtles");
  });

  it("should return a string following the pattern 'key1=encodedUriValue1&key2=encodedUriValue1' string when param array has multiple values", () => {
    const queryParams = {
      message: "I like turtles",
      teller: "John Doe",
    };

    expect(queryParamsAsString(queryParams)).toBe(
      "message=I%20like%20turtles&teller=John%20Doe",
    );
  });
});

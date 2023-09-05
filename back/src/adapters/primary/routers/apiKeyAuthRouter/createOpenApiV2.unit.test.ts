import { createOpenApiSpecV2 } from "./createOpenApiV2";

describe("createOpenApiSpecV2 function to generate OpenAPI v2 spec", () => {
  it("does not throw", () => {
    expect(() => createOpenApiSpecV2("whatever")).not.toThrow();
  });
});

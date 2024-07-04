import { expectToEqual } from "../test.helpers";
import { paginationQueryParamsSchema } from "./pagination.schema";

describe("pagination", () => {
  describe("paginationQueryParamsSchema", () => {
    it("should give default pagination value when not provided", () => {
      const params = paginationQueryParamsSchema.parse({});
      expectToEqual(params, {
        page: 1,
        perPage: 100,
      });
    });
  });
});

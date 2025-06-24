import {
  defaultPerPageInWebPagination,
  expectToEqual,
  maxPerPageInWebPagination,
} from "shared";
import { flatDiscussionQueryParamsToGetPaginatedDiscussionsParams } from "./GetDiscussionsForUser";

describe("GetDiscussionsForUser", () => {
  describe("flatDiscussionQueryParamsTogetPaginatedDiscussionsParams", () => {
    it("converts flat filters to correct filters", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        search: "siret1",
        statuses: ["PENDING", "ACCEPTED"],
      });
      expectToEqual(result, {
        filters: {
          search: "siret1",
          statuses: ["PENDING", "ACCEPTED"],
        },
        order: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("returns unfiltered results when no status or siret is provided", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams(
        {},
      );
      expectToEqual(result, {
        order: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("wraps a single status in an array", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        statuses: "PENDING",
      });
      expectToEqual(result, {
        filters: {
          statuses: ["PENDING"],
        },
        order: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("adds a default order by createdAt, desc if none is provided", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams(
        {},
      );
      expectToEqual(result, {
        order: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("uses provided order properties when they exist", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        orderBy: "createdAt",
        orderDirection: "asc",
      });
      expectToEqual(result, {
        order: { by: "createdAt", direction: "asc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
      });
    });

    it("makes sure pagination is in the correct range, and max it to defaultPerPageInWebPagination", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        page: 2,
        perPage: 150,
      });
      expectToEqual(result, {
        order: { by: "createdAt", direction: "desc" },
        pagination: { page: 2, perPage: maxPerPageInWebPagination },
      });
    });
  });
});

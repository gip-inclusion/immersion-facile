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
        userRole: "establishment",
      });
      expectToEqual(result, {
        filters: {
          search: "siret1",
          statuses: ["PENDING", "ACCEPTED"],
        },
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
        userRole: "establishment",
      });
    });

    it("returns unfiltered results when no status or siret is provided", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        userRole: "potentialBeneficiary",
      });
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
        userRole: "potentialBeneficiary",
      });
    });

    it("wraps a single status in an array", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        statuses: "PENDING",
        userRole: "establishment",
      });
      expectToEqual(result, {
        filters: {
          statuses: ["PENDING"],
        },
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
        userRole: "establishment",
      });
    });

    it("adds a default order by createdAt, desc if none is provided", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        userRole: "establishment",
      });
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
        userRole: "establishment",
      });
    });

    it("uses provided order properties when they exist", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        orderBy: "createdAt",
        orderDirection: "asc",
        userRole: "establishment",
      });
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "asc" },
        pagination: { page: 1, perPage: defaultPerPageInWebPagination },
        userRole: "establishment",
      });
    });

    it("makes sure pagination is in the correct range, and max it to defaultPerPageInWebPagination", () => {
      const result = flatDiscussionQueryParamsToGetPaginatedDiscussionsParams({
        page: 2,
        perPage: 150,
        userRole: "establishment",
      });
      expectToEqual(result, {
        sort: { by: "createdAt", direction: "desc" },
        pagination: { page: 2, perPage: maxPerPageInWebPagination },
        userRole: "establishment",
      });
    });
  });
});

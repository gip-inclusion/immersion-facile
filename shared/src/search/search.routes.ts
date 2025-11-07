import { defineRoute, defineRoutes } from "shared-routes";
import { createDiscussionSchema } from "../discussion/discussion.schema";
import { groupWithResultsSchema } from "../group/group.schema";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import {
  searchResultQuerySchema,
  siretAndAppellationSchema,
} from "../siretAndAppellation/SiretAndAppellation.schema";
import { expressEmptyResponseBody } from "../zodUtils";
import {
  getExternalOffersFlatParamsSchema,
  getOffersFlatParamsSchema,
} from "./SearchQueryParams.schema";
import {
  paginatedSearchResultsSchema,
  searchResultSchema,
  searchResultsSchema,
} from "./SearchResult.schema";

export type SearchRoutes = typeof searchImmersionRoutes;
export const searchImmersionRoutes = defineRoutes({
  getGroupBySlug: defineRoute({
    method: "get",
    url: "/groups/:groupSlug",
    responses: {
      200: groupWithResultsSchema,
      404: httpErrorSchema,
    },
  }),
  getOffers: defineRoute({
    method: "get",
    url: "/offers",
    queryParamsSchema: getOffersFlatParamsSchema,
    responses: {
      200: paginatedSearchResultsSchema,
      400: httpErrorSchema,
    },
  }),
  getExternalOffers: defineRoute({
    method: "get",
    url: "/external-offers",
    queryParamsSchema: getExternalOffersFlatParamsSchema,
    responses: {
      200: searchResultsSchema,
      400: httpErrorSchema,
    },
  }),
  contactEstablishment: defineRoute({
    method: "post",
    url: "/contact-establishment",
    requestBodySchema: createDiscussionSchema,
    responses: {
      201: expressEmptyResponseBody,
      400: httpErrorSchema,
      404: httpErrorSchema,
      409: httpErrorSchema,
    },
  }),
  getSearchResult: defineRoute({
    method: "get",
    url: "/search-result",
    queryParamsSchema: searchResultQuerySchema,
    responses: {
      200: searchResultSchema,
      400: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
  getExternalSearchResult: defineRoute({
    method: "get",
    url: "/external-search-result",
    queryParamsSchema: siretAndAppellationSchema,
    responses: {
      200: searchResultSchema,
      400: httpErrorSchema,
      404: httpErrorSchema,
    },
  }),
});

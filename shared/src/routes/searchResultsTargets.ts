import { createTargets, CreateTargets, Target } from "http-client";
import { ContactEstablishmentRequestDto } from "../contactEstablishmentRequest/contactEstablishmentRequest.dto";
import { SearchImmersionQueryParamsDto } from "../searchImmersion/SearchImmersionQueryParams.dto";
import { contactEstablishmentRoute, immersionOffersRoute } from "./routes";

const getSearchResultsByGroupUrl = "/group-offers/:slug";

export type SearchResultsTargets = CreateTargets<{
  getOffersByGroupSlug: Target<
    void,
    void,
    void,
    typeof getSearchResultsByGroupUrl
  >;
  searchImmersion: Target<void, SearchImmersionQueryParamsDto>;
  contactEstablishment: Target<ContactEstablishmentRequestDto>;
}>;

export const searchResultsTargets = createTargets<SearchResultsTargets>({
  getOffersByGroupSlug: {
    method: "GET",
    url: getSearchResultsByGroupUrl,
  },
  searchImmersion: {
    method: "GET",
    url: `/${immersionOffersRoute}`,
  },
  contactEstablishment: {
    method: "POST",
    url: `/${contactEstablishmentRoute}`,
  },
});

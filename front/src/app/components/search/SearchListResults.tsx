import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import {
  Tag as ImTag,
  SearchResultIllustration,
  useStyleUtils,
} from "react-design-system";
import {
  type AppellationCode,
  domElementIds,
  hasSearchGeoParams,
  isSuperEstablishment,
  type SearchResultDto,
} from "shared";
import { SearchMiniMap } from "src/app/components/search/SearchMiniMap";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { type SearchRoute, useSearch } from "src/app/hooks/search.hooks";
import { routes } from "src/app/routes/routes";
import { filterParamsForRoute } from "src/app/utils/url.utils";
import { searchIllustrations } from "src/assets/img/illustrations";
import labonneboiteLogoUrl from "src/assets/img/logo-lbb-on-left.png";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";

import type { Link } from "type-route";
import { SearchResult } from "./SearchResult";

type ResultsPerPageOption = (typeof resultsPerPageOptions)[number];

const resultsPerPageOptions = ["1", "6", "12", "24", "48"] as const;

export const SearchListResults = ({
  showDistance,
  route,
  isExternal,
}: {
  route: SearchRoute;
  showDistance: boolean;
  isExternal: boolean;
}) => {
  const { triggerSearch } = useSearch(route);
  const { data: searchResults, pagination } = useAppSelector(
    searchSelectors.searchResultsWithPagination,
  );
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const [activeMarkerKey, setActiveMarkerKey] = useState<string | null>(null);
  const { cx, classes } = useStyleUtils();
  const { totalPages, currentPage, numberPerPage } = pagination;
  const hasResults = searchResults.length > 0;
  const isLastPage = currentPage === totalPages;
  const isSearchWithAppellation =
    searchParams.appellations && searchParams.appellations.length > 0;
  const isSearchWithGeoParams = hasSearchGeoParams(searchParams);
  const isSearchWithAppellationAndGeoParams =
    isSearchWithGeoParams && isSearchWithAppellation;
  const shouldShowLaBonneBoiteCTA =
    !isExternal &&
    hasResults &&
    isLastPage &&
    isSearchWithAppellationAndGeoParams;
  return (
    <div className={fr.cx("fr-container", isExternal && "fr-mb-8w")}>
      <div
        className={fr.cx(
          "fr-grid-row",
          "fr-grid-row--gutters",
          !hasResults && "fr-grid-row--center",
        )}
      >
        <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>
          <div
            className={fr.cx(
              "fr-grid-row",
              "fr-grid-row--gutters",
              !hasResults && "fr-grid-row--center",
            )}
          >
            {!hasResults && isExternal && (
              <div
                className={cx(
                  fr.cx(
                    `fr-col-${isExternal && !isSearchWithAppellationAndGeoParams ? "8" : "6"}`,
                    "fr-py-6w",
                  ),
                  classes["text-centered"],
                )}
              >
                <p className={fr.cx("fr-h6")}>
                  {isExternal && !isSearchWithAppellationAndGeoParams
                    ? "Votre recherche n'a pas abouti car vous n'avez pas sélectionné de métier ou de ville."
                    : "Aucun résultat ne correspond à votre recherche 😓"}
                </p>
                <p>
                  {isExternal && !isSearchWithAppellationAndGeoParams
                    ? "Sélectionnez une ville et un métier pour trouver des entreprises à fort potentiel d'embauche."
                    : "Vous pouvez essayer d'élargir votre recherche en augmentant le rayon de recherche ou en sélectionnant un métier."}
                </p>
              </div>
            )}
            {!hasResults &&
              !isExternal &&
              isSearchWithAppellationAndGeoParams && (
                <div
                  className={cx(
                    fr.cx("fr-col-6", "fr-py-6w"),
                    classes["text-centered"],
                  )}
                >
                  <p className={fr.cx("fr-h6")}>
                    Nous n'avons pas trouvé d'entreprises actuellement
                    disponibles correspondant à votre recherche 🥺
                  </p>
                  <p>
                    Découvrez d'autres opportunités d'entreprise à fort
                    potentiel d'embauche grâce à notre partenaire La Bonne Boîte
                    !
                  </p>
                  <Button
                    id={domElementIds.search.noResultsLbbButton}
                    linkProps={
                      routes.externalSearch(
                        getFilteredSearchParamsForLBB(searchParams),
                      ).link
                    }
                    priority="primary"
                  >
                    Rechercher sur La Bonne Boîte
                  </Button>
                </div>
              )}
            {hasResults &&
              searchResults.map((searchResult, index) => {
                const appellations = searchResult.appellations;
                const searchResultAppellationCode = appellations?.length
                  ? appellations[0].appellationCode
                  : null;
                const appellationCode =
                  searchResultAppellationCode ||
                  searchParams.appellationCodes?.[0];
                return (
                  <div
                    className={fr.cx("fr-col-12", "fr-col-md-6", "fr-col-lg-6")}
                    key={`${searchResult.siret}-${searchResult.rome}-${searchResult.locationId}`}
                  >
                    <SearchResult
                      establishment={searchResult}
                      illustration={
                        <SearchResultIllustration
                          illustration={
                            searchIllustrations[
                              index % searchIllustrations.length
                            ]
                          }
                        >
                          <div className={fr.cx("fr-p-1v")}>
                            {isSuperEstablishment(
                              searchResult.establishmentScore,
                            ) && <ImTag theme="superEnterprise" />}
                            {searchResult.fitForDisabledWorkers ===
                              "yes-ft-certified" && (
                              <ImTag
                                theme="rqth"
                                label="Reconnue handi-engagée"
                              />
                            )}
                            {searchResult.fitForDisabledWorkers ===
                              "yes-declared-only" && <ImTag theme="rqth" />}
                            {!searchResult.voluntaryToImmersion && (
                              <ImTag theme="lbb" />
                            )}
                          </div>
                        </SearchResultIllustration>
                      }
                      showDistance={showDistance}
                      linkProps={makeOfferLink(
                        route,
                        searchResult,
                        appellationCode,
                      )}
                    />
                  </div>
                );
              })}
            {shouldShowLaBonneBoiteCTA && (
              <LaBonneBoiteCallToAction searchParams={searchParams} />
            )}
          </div>
        </div>
        {hasResults && (
          <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
            <SearchMiniMap
              kind="list"
              activeMarkerKey={activeMarkerKey}
              setActiveMarkerKey={setActiveMarkerKey}
              isExternal={isExternal}
            />
          </div>
        )}
        {!isExternal && (
          <div className={fr.cx("fr-container", "fr-mb-10w")}>
            <div
              className={fr.cx(
                "fr-grid-row",
                "fr-grid-row--middle",
                "fr-mt-4w",
              )}
            >
              <div className={fr.cx("fr-col-10", "fr-grid-row")}>
                <Pagination
                  showFirstLast
                  count={totalPages}
                  defaultPage={currentPage}
                  getPageLinkProps={(pageNumber) => ({
                    title: `Résultats de recherche, page : ${pageNumber}`,
                    onClick: (event) => {
                      event.preventDefault();
                      triggerSearch(
                        {
                          ...searchParams,
                          page: pageNumber,
                        },
                        isExternal,
                      );
                    },
                    href: "#", // TODO : PR vers react-dsfr pour gérer pagination full front
                    key: `pagination-link-${pageNumber}`,
                  })}
                  className={fr.cx("fr-mt-1w")}
                />
              </div>
              <div
                className={fr.cx(
                  "fr-col-2",
                  "fr-grid-row",
                  "fr-grid-row--right",
                )}
              >
                <Select
                  label=""
                  options={[
                    ...resultsPerPageOptions.map((numberAsString) => ({
                      label: `${numberAsString} résultats / page`,
                      value: numberAsString,
                    })),
                  ]}
                  nativeSelectProps={{
                    id: domElementIds.search.resultPerPageDropdown,
                    onChange: (event) => {
                      const value = event.currentTarget.value;
                      triggerSearch(
                        {
                          ...searchParams,
                          perPage: Number.parseInt(value),
                        },
                        isExternal,
                      );
                    },
                    value: numberPerPage.toString() as ResultsPerPageOption,
                    "aria-label": "Nombre de résultats par page",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const makeOfferLink = (
  route: SearchRoute,
  { siret, locationId, voluntaryToImmersion }: SearchResultDto,
  appellationCode?: AppellationCode,
): Link => {
  const definedAppellationCode: AppellationCode = appellationCode ?? "";
  if (!voluntaryToImmersion)
    return routes.searchResultExternal({
      siret,
      appellationCode: [definedAppellationCode],
    }).link;

  const searchParams = {
    appellationCode: [definedAppellationCode],
    siret,
    ...(locationId ? { location: locationId } : {}),
  };

  return route.name === "search" || route.name === "externalSearch"
    ? routes.searchResult(searchParams).link
    : routes.searchResultForStudent(searchParams).link;
};

const getFilteredSearchParamsForLBB = (
  searchParams: ReturnType<typeof searchSelectors.searchParams>,
) =>
  filterParamsForRoute({
    urlParams: searchParams,
    matchingParams: {
      distanceKm: undefined,
      latitude: undefined,
      longitude: undefined,
      place: undefined,
      appellations: undefined,
      nafCodes: undefined,
      nafLabel: undefined,
      appellationCodes: undefined,
      fitForDisabledWorkers: undefined,
    },
  });

const LaBonneBoiteCallToAction = ({
  searchParams,
}: {
  searchParams: ReturnType<typeof searchSelectors.searchParams>;
}) => {
  const filteredSearchParams = getFilteredSearchParamsForLBB(searchParams);
  return (
    <div className={fr.cx("fr-col-12", "fr-col-md-6", "fr-col-lg-6")}>
      <Card
        id={domElementIds.search.noResultsLbbCard}
        imageUrl={labonneboiteLogoUrl}
        imageAlt="Logo de LaBonneBoite"
        title="Découvrez d'autres entreprises"
        desc="Explorez plus d'opportunités avec notre partenaire La Bonne Boite"
        footer={
          <Button
            linkProps={routes.externalSearch(filteredSearchParams).link}
            priority="primary"
          >
            Découvrez d'autres entreprises avec La Bonne Boite
          </Button>
        }
      />
    </div>
  );
};

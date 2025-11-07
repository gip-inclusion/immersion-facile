import { fr } from "@codegouvfr/react-dsfr";
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
import { useStyles } from "tss-react/dsfr";
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
  const shouldShowExternalResultsPush =
    !isExternal &&
    hasSearchGeoParams(searchParams) &&
    searchParams.appellations &&
    searchParams.appellations.length > 0;
  return (
    <div className={fr.cx("fr-container")}>
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
            {!hasResults && (
              <div
                className={cx(
                  fr.cx("fr-col-6", "fr-py-6w"),
                  classes["text-centered"],
                )}
              >
                <p className={fr.cx("fr-h6")}>
                  Aucun résultat ne correspond à votre recherche 😓
                </p>
                <p>
                  Vous pouvez essayer d'élargir votre recherche en augmentant le
                  rayon de recherche ou en ne sélectionnant pas de métier.
                </p>
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
                            {searchResult.voluntaryToImmersion && (
                              <ImTag theme="voluntaryToImmersion" />
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
          </div>
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
          <SearchMiniMap
            kind="list"
            activeMarkerKey={activeMarkerKey}
            setActiveMarkerKey={setActiveMarkerKey}
            isExternal={isExternal}
          />
          {shouldShowExternalResultsPush && <ExternalResultsPush />}
        </div>
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

const ExternalResultsPush = () => {
  const { cx } = useStyles();
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const filtereddSearchParams = filterParamsForRoute({
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
    },
  });
  return (
    <aside className={fr.cx("fr-mt-4w")}>
      <Card
        imageUrl={labonneboiteLogoUrl}
        imageAlt="Logo de LaBonneBoite"
        title="Et si vous élargissiez votre recherche ?"
        desc="Des entreprises à fort potentiel d'embauche peuvent être suggérées grâce
        à notre partenaire LaBonneBoite."
        className={cx("over-footer")}
        linkProps={routes.externalSearch(filtereddSearchParams).link}
        enlargeLink
      />
    </aside>
  );
};

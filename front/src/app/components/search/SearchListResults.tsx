import { fr } from "@codegouvfr/react-dsfr";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useCallback, useEffect, useState } from "react";
import {
  Tag as ImTag,
  SearchResultIllustration,
  useStyleUtils,
} from "react-design-system";
import {
  type AppellationCode,
  domElementIds,
  isSuperEstablishment,
  type SearchResultDto,
} from "shared";
import { SearchMiniMap } from "src/app/components/search/SearchMiniMap";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { SearchRoute } from "src/app/hooks/search.hooks";
import { routes } from "src/app/routes/routes";
import { searchIllustrations } from "src/assets/img/illustrations";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import type { Link } from "type-route";
import { SearchResult } from "./SearchResult";

type ResultsPerPageOptions = (typeof resultsPerPageOptions)[number];

const resultsPerPageOptions = ["6", "12", "24", "48"] as const;
const defaultResultsPerPage: ResultsPerPageOptions = "12";

const isResultPerPageOption = (value: string): value is ResultsPerPageOptions =>
  resultsPerPageOptions.includes(value as ResultsPerPageOptions);

export const SearchListResults = ({
  showDistance,
  currentPage,
  setCurrentPageValue,
  route,
}: {
  route: SearchRoute;
  showDistance: boolean;
  currentPage: number;
  setCurrentPageValue: (newPageValue: number) => void;
}) => {
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const [displayedResults, setDisplayedResults] =
    useState<SearchResultDto[]>(searchResults);
  const [resultsPerPage, setResultsPerPage] = useState<ResultsPerPageOptions>(
    defaultResultsPerPage,
  );
  const [activeMarkerKey, setActiveMarkerKey] = useState<string | null>(null);
  const { cx, classes } = useStyleUtils();
  const resultsPerPageValue = Number.parseInt(resultsPerPage);
  const totalPages = Math.ceil(searchResults.length / resultsPerPageValue);
  const hasResults = displayedResults.length > 0;

  const getSearchResultsForPage = useCallback(
    (currentPage: number) => {
      const currentPageIndex = currentPage - 1;
      const start = currentPageIndex * resultsPerPageValue;
      const end = start + resultsPerPageValue;
      return searchResults.slice(start, end);
    },
    [searchResults, resultsPerPageValue],
  );

  const onCurrentPageChange = useCallback(
    (newPage: number) => {
      setCurrentPageValue(newPage);
    },
    [setCurrentPageValue],
  );

  useEffect(() => {
    setDisplayedResults(getSearchResultsForPage(currentPage));
  }, [currentPage, getSearchResultsForPage]);

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
              displayedResults.map((searchResult, index) => {
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
                            {searchResult.fitForDisabledWorkers && (
                              <ImTag theme="rqth" />
                            )}
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
          />
        </div>
        <div className={fr.cx("fr-container", "fr-mb-10w")}>
          <div
            className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mt-4w")}
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
                    onCurrentPageChange(pageNumber);
                  },
                  href: "#", // TODO : PR vers react-dsfr pour gérer pagination full front
                  key: `pagination-link-${pageNumber}`,
                })}
                className={fr.cx("fr-mt-1w")}
              />
            </div>
            <div
              className={fr.cx("fr-col-2", "fr-grid-row", "fr-grid-row--right")}
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
                    if (isResultPerPageOption(value)) {
                      setResultsPerPage(value);
                    }
                  },
                  value: resultsPerPage,
                  "aria-label": "Nombre de résultats par page",
                }}
              />
            </div>
          </div>
        </div>
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
      appellationCode: definedAppellationCode,
    }).link;

  const searchParams = {
    appellationCode: definedAppellationCode,
    siret,
    ...(locationId ? { location: locationId } : {}),
  };

  return route.name === "search"
    ? routes.searchResult(searchParams).link
    : routes.searchResultForStudent(searchParams).link;
};

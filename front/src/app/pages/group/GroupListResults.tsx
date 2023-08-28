import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { domElementIds, SearchResultDto } from "shared";
import { SearchResult } from "src/app/components/search/SearchResult";
import { routes } from "src/app/routes/routes";

type GroupListResultsProps = {
  results: SearchResultDto[];
};

export const GroupListResults = ({ results }: GroupListResultsProps) => {
  const resultsPerPageOptions = ["6", "12", "24", "48"] as const;
  type ResultsPerPageOptions = (typeof resultsPerPageOptions)[number];

  const defaultResultsPerPage: ResultsPerPageOptions = "12";
  const initialPage = 0;
  const isResultPerPageOption = (
    value: string,
  ): value is ResultsPerPageOptions =>
    resultsPerPageOptions.includes(value as ResultsPerPageOptions);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [resultsPerPage, setResultsPerPage] = useState<ResultsPerPageOptions>(
    defaultResultsPerPage,
  );
  const resultsPerPageValue = parseInt(resultsPerPage);
  const totalPages = Math.ceil(results.length / resultsPerPageValue);
  const getSearchResultsForPage = (currentPage: number): SearchResultDto[] => {
    const start = currentPage * resultsPerPageValue;
    const end = start + resultsPerPageValue;
    return results.slice(start, end);
  };
  return (
    <>
      <div className={fr.cx("fr-container")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {getSearchResultsForPage(currentPage).map((searchResult) => (
            <SearchResult
              key={searchResult.siret + "-" + searchResult.rome} // Should be unique !
              establishment={searchResult}
              onButtonClick={() => {
                const appellationCode =
                  searchResult.appellations.length &&
                  searchResult.appellations[0]?.appellationCode;
                if (appellationCode) {
                  routes
                    .searchResult({
                      appellationCode,
                      siret: searchResult.siret,
                    })
                    .push();
                }
              }}
            />
          ))}
        </div>
      </div>
      <div className={fr.cx("fr-container", "fr-mb-10w")}>
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mt-4w")}
        >
          <div className={fr.cx("fr-col-10", "fr-grid-row")}>
            <Pagination
              showFirstLast
              count={totalPages}
              defaultPage={currentPage + 1}
              getPageLinkProps={(pageNumber) => ({
                title: `Résultats de recherche, page : ${pageNumber}`,
                onClick: (event) => {
                  event.preventDefault();
                  setCurrentPage(pageNumber - 1);
                },
                href: "#",
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
                ...resultsPerPageOptions.map((number) => ({
                  label: `${number} résultats / page`,
                  value: number,
                })),
              ]}
              nativeSelectProps={{
                id: domElementIds.search.resultPerPageDropdown,
                onChange: (event) => {
                  const value = event.currentTarget?.value;
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
    </>
  );
};

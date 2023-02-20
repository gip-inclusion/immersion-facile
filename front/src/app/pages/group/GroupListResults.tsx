import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { ContactMethod, SearchImmersionResultDto } from "shared";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "src/app/components/search/ContactEstablishmentModal";
import { SearchResult } from "src/app/components/search/SearchResult";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "react-design-system";
import { SuccessFeedback } from "src/app/components/SuccessFeedback";
const getFeedBackMessage = (contactMethod?: ContactMethod) => {
  switch (contactMethod) {
    case "EMAIL":
      return "L'entreprise a été contactée avec succès.";
    case "PHONE":
    case "IN_PERSON":
      return "Un email vient de vous être envoyé.";
    default:
      return null;
  }
};
type GroupListResultsProps = {
  results: SearchImmersionResultDto[];
};

export const GroupListResults = ({ results }: GroupListResultsProps) => {
  const resultsPerPageOptions = [6, 12, 24, 48] as const;
  type ResultsPerPageOptions = (typeof resultsPerPageOptions)[number];

  const defaultResultsPerPage: ResultsPerPageOptions = 12;
  const initialPage = 0;
  const isResultPerPageOption = (
    value: number,
  ): value is ResultsPerPageOptions =>
    resultsPerPageOptions.includes(value as ResultsPerPageOptions);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [resultsPerPage, setResultsPerPage] = useState<ResultsPerPageOptions>(
    defaultResultsPerPage,
  );
  const { modalState, dispatch } = useContactEstablishmentModal();
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<
    string | null
  >(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const getSearchResultsForPage = (
    currentPage: number,
  ): SearchImmersionResultDto[] => {
    const start = currentPage * resultsPerPage;
    const end = start + resultsPerPage;
    return results.slice(start, end);
  };
  return (
    <>
      <div className={fr.cx("fr-container")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {getSearchResultsForPage(currentPage).map((result) => (
            <SearchResult
              key={result.siret + "-" + result.rome} // Should be unique !
              establishment={result}
              onButtonClick={() =>
                dispatch({
                  type: "CLICKED_OPEN",
                  payload: {
                    immersionOfferRome: result.rome,
                    immersionOfferSiret: result.siret,
                    siret: result.siret,
                    offer: {
                      romeCode: result.rome,
                      romeLabel: result.romeLabel,
                    },
                    contactMethod: result.contactMode,
                    searchResultData: result,
                  },
                })
              }
              disableButton={modalState.isValidating}
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
              label="Nombre de résultats par page"
              onChange={(event) => {
                const value = parseInt(event.currentTarget?.value);
                if (isResultPerPageOption(value)) {
                  setResultsPerPage(value);
                }
              }}
              value={resultsPerPage}
              options={[
                ...resultsPerPageOptions.map((number) => ({
                  label: `${number} résultats / page`,
                  value: number,
                })),
              ]}
              id="im-search-page__results-per-page-dropdown"
              hideLabel
            />
          </div>
        </div>
      </div>
      <ContactEstablishmentModal
        modalState={modalState}
        dispatch={dispatch}
        onSuccess={() => {
          setSuccessfulValidatedMessage(
            getFeedBackMessage(modalState.contactMethod),
          );
          setSuccessfullyValidated(true);
        }}
      />
      {successfulValidationMessage && (
        <SuccessFeedback
          open={successFullyValidated}
          handleClose={() => {
            setSuccessfulValidatedMessage(null);
            setSuccessfullyValidated(false);
          }}
        >
          {successfulValidationMessage}
        </SuccessFeedback>
      )}
    </>
  );
};

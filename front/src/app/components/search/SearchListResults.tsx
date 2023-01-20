import React, { useEffect, useState } from "react";
import { ContactMethod, SearchImmersionResultDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { SuccessFeedback } from "src/app/components/SuccessFeedback";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "./ContactEstablishmentModal";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { SearchResult } from "./SearchResult";
import { Select } from "src/../../libs/react-design-system";
import { fr } from "@codegouvfr/react-dsfr";

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

const resultsPerPageOptions = [6, 12, 24, 48];

export const SearchListResults = () => {
  const searchResults = useAppSelector(searchSelectors.searchResults);
  // prettier-ignore
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<string | null>(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const { modalState, dispatch } = useContactEstablishmentModal();
  const [displayedResults, setDisplayedResults] =
    useState<SearchImmersionResultDto[]>(searchResults);
  const [resultsPerPage, setResultsPerPage] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const getSearchResultsForPage = (currentPage: number) => {
    const start = currentPage * resultsPerPage;
    const end = start + resultsPerPage;
    return searchResults.slice(start, end);
  };

  useEffect(() => {
    setDisplayedResults(getSearchResultsForPage(currentPage));
  }, [currentPage, resultsPerPage]);

  return (
    <div className="fr-container fr-mb-10w">
      <div className="fr-grid-row fr-grid-row--gutters">
        {displayedResults.map((searchResult) => (
          <SearchResult
            key={searchResult.siret + "-" + searchResult.rome} // Should be unique !
            searchResult={searchResult}
            onButtonClick={() =>
              dispatch({
                type: "CLICKED_OPEN",
                payload: {
                  immersionOfferRome: searchResult.rome,
                  immersionOfferSiret: searchResult.siret,
                  siret: searchResult.siret,
                  offer: {
                    romeCode: searchResult.rome,
                    romeLabel: searchResult.romeLabel,
                  },
                  contactMethod: searchResult.contactMode,
                  searchResultData: searchResult,
                },
              })
            }
            disableButton={modalState.isValidating}
          />
        ))}
        <div
          className={fr.cx(
            "fr-container",
            "fr-grid-row",
            "fr-grid-row--center",
          )}
        >
          <div className={fr.cx("fr-col-9")}>
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
                href: "#", // TODO : PR vers react-dsfr pour gérer pagination full front
                key: `pagination-link-${pageNumber}`,
              })}
            />
          </div>
          <div className={fr.cx("fr-col-3")}>
            <Select
              label="Nombres de resultats par page"
              className={fr.cx("")}
              onChange={(event) => {
                setResultsPerPage(parseInt(event.currentTarget.value));
              }}
              value={resultsPerPage}
              options={[
                ...resultsPerPageOptions.map((number) => ({
                  label: `${number}`,
                  value: number,
                })),
              ]}
              id="im-search-page__results-per-page-dropdown"
            />
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
      </div>
    </div>
  );
};

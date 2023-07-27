import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { ContactMethod, domElementIds, SearchImmersionResultDto } from "shared";
import { useStyleUtils } from "react-design-system";
import { SuccessFeedback } from "src/app/components/SuccessFeedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  ContactModalContentProps,
  ModalContactContent,
} from "./ContactModalContent";
import { SearchResult } from "./SearchResult";

const {
  Component: ContactModal,
  open: openContactModal,
  close: closeContactModal,
} = createModal({
  isOpenedByDefault: false,
  id: "contact",
});

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

type ResultsPerPageOptions = (typeof resultsPerPageOptions)[number];

const resultsPerPageOptions = ["6", "12", "24", "48"] as const;
const defaultResultsPerPage: ResultsPerPageOptions = "12";
const initialPage = 0;

const isResultPerPageOption = (value: string): value is ResultsPerPageOptions =>
  resultsPerPageOptions.includes(value as ResultsPerPageOptions);

export const SearchListResults = () => {
  const searchResults = useAppSelector(searchSelectors.searchResults);
  // prettier-ignore
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<string | null>(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const [displayedResults, setDisplayedResults] =
    useState<SearchImmersionResultDto[]>(searchResults);
  const [resultsPerPage, setResultsPerPage] = useState<ResultsPerPageOptions>(
    defaultResultsPerPage,
  );
  const [modalContent, setModalContent] =
    useState<Omit<ContactModalContentProps, "onSuccess">>();
  const { cx, classes } = useStyleUtils();
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const resultsPerPageValue = parseInt(resultsPerPage);
  const totalPages = Math.ceil(searchResults.length / resultsPerPageValue);
  const getSearchResultsForPage = (currentPage: number) => {
    const start = currentPage * resultsPerPageValue;
    const end = start + resultsPerPageValue;
    return searchResults.slice(start, end);
  };

  useEffect(() => {
    setDisplayedResults(getSearchResultsForPage(currentPage));
  }, [currentPage, resultsPerPage]);
  const hasResults = displayedResults.length > 0;
  return (
    <>
      <div className={fr.cx("fr-container")}>
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
            displayedResults.map((searchResult) => (
              <SearchResult
                key={searchResult.siret + "-" + searchResult.rome} // Should be unique !
                establishment={searchResult}
                onButtonClick={() => {
                  setModalContent({
                    siret: searchResult.siret,
                    appellations: searchResult.appellations,
                    contactMethod: searchResult.contactMode,
                    searchResultData: searchResult,
                    onClose: () => closeContactModal(),
                  });
                  openContactModal();
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

      <ContactModal
        title={
          modalContent?.contactMethod
            ? `Contactez l'entreprise ${modalContent.searchResultData?.name}`
            : "Tentez votre chance !"
        }
        size="large"
      >
        {modalContent && (
          <ModalContactContent
            {...modalContent}
            onSuccess={() => {
              setSuccessfulValidatedMessage(
                getFeedBackMessage(modalContent.contactMethod),
              );
              setSuccessfullyValidated(true);
              closeContactModal();
            }}
            onClose={() => {
              closeContactModal();
            }}
          />
        )}
      </ContactModal>

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

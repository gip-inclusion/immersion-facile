import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { ContactMethod, domElementIds, SearchImmersionResultDto } from "shared";
import { SearchResult } from "src/app/components/search/SearchResult";
import { SuccessFeedback } from "src/app/components/SuccessFeedback";
import {
  ContactModalContentProps,
  ModalContactContent,
} from "../../components/search/ContactModalContent";

const { ContactModal, openContactModal, closeContactModal } = createModal({
  isOpenedByDefault: false,
  name: "contact",
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
type GroupListResultsProps = {
  results: SearchImmersionResultDto[];
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
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<
    string | null
  >(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const [modalContent, setModalContent] =
    useState<Omit<ContactModalContentProps, "onSuccess">>();
  const getSearchResultsForPage = (
    currentPage: number,
  ): SearchImmersionResultDto[] => {
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
                setModalContent({
                  siret: searchResult.siret,
                  offer: {
                    romeCode: searchResult.rome,
                    romeLabel: searchResult.romeLabel,
                  },
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
      <ContactModal
        title={
          modalContent?.contactMethod
            ? "Contactez l'entreprise"
            : "Tentez votre chance !"
        }
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

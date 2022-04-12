import { CircularProgress } from "@mui/material";
import React, { ReactNode, useState } from "react";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { ContactMethod } from "src/shared/formEstablishment/FormEstablishment.dto";
import { SuccessFeedback } from "src/uiComponents/SuccessFeedback";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "./ContactEstablishmentModal";
import { EnterpriseSearchResult } from "./EnterpriseSearchResult";

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

export const SearchResultPanel = () => {
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchInfo = useAppSelector(searchSelectors.searchInfo);

  // prettier-ignore
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<string | null>(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const { modalState, dispatch } = useContactEstablishmentModal();

  if (searchStatus === "initialFetch")
    return (
      <SearchInfos>
        <CircularProgress color="inherit" size="75px" />
      </SearchInfos>
    );

  if (searchInfo && searchResults.length === 0)
    return <SearchInfos>{searchInfo}</SearchInfos>;

  return (
    <>
      {searchResults.map((searchResult) => (
        <EnterpriseSearchResult
          key={searchResult.siret + "-" + searchResult.rome} // Should be unique !
          searchResult={searchResult}
          onButtonClick={() =>
            dispatch({
              type: "CLICKED_OPEN",
              payload: {
                immersionOfferRome: searchResult.rome,
                immersionOfferSiret: searchResult.siret,
                siret: searchResult.siret,
                romeLabel: searchResult.romeLabel,
                contactMethod: searchResult.contactMode,
              },
            })
          }
          disableButton={modalState.isValidating}
        />
      ))}
      {searchStatus === "extraFetch" && searchInfo && (
        <SearchInfos>
          <div className="flex flex-col items-center">
            <div>{searchInfo}</div>
            <CircularProgress color="inherit" size="40px" />
          </div>
        </SearchInfos>
      )}
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

type SearchInfosProps = {
  children: ReactNode;
};

const SearchInfos = ({ children }: SearchInfosProps) => (
  <div className="text-white sm:h-full text-2xl font-semibold flex justify-center items-center pb-16">
    <div>{children}</div>
  </div>
);

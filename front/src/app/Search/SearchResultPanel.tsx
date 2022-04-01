import { CircularProgress } from "@mui/material";
import React, { ReactNode, useState } from "react";
import { searchEpic } from "src/app/dependencies";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "src/app/Search/ContactEstablishmentModal";
import { EnterpriseSearchResult } from "src/app/Search/EnterpriseSearchResult";
import { SuccessFeedback } from "src/components/SuccessFeedback";
import { ContactMethod } from "src/shared/formEstablishment/FormEstablishment.dto";
import { useObservable } from "src/useObservable";

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
  const searchResults = useObservable(searchEpic.views.searchResults$, []);
  const isSearching = useObservable(searchEpic.views.isSearching$, false);
  const searchInfo = useObservable(
    searchEpic.views.searchInfo$,
    "Veuillez sélectionner vos critères",
  );

  // prettier-ignore
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<string | null>(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const { modalState, dispatch } = useContactEstablishmentModal();

  if (isSearching)
    return (
      <SearchInfos>
        <CircularProgress color="inherit" size="75px" />
      </SearchInfos>
    );

  if (searchInfo) return <SearchInfos>{searchInfo}</SearchInfos>;

  return (
    <>
      {searchResults.map((searchResult) => (
        <EnterpriseSearchResult
          key={searchResult.siret + "_" + searchResult.rome} // Should be unique !
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

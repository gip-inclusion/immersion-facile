import { CircularProgress } from "@mui/material";
import React, { ReactNode, useState } from "react";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "src/app/Search/ContactEstablishmentModal";
import { EnterpriseSearchResult } from "src/app/Search/EnterpriseSearchResult";
import { SuccessFeedback } from "src/components/SuccessFeedback";
import { ContactMethod } from "src/shared/formEstablishment/FormEstablishment.dto";
import type { SearchImmersionResultDto } from "src/shared/SearchImmersionDto";

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

type SearchResultsProps = {
  searchResults: SearchImmersionResultDto[] | null;
  isSearching: boolean;
};

export const SearchResultPanel = ({
  searchResults,
  isSearching,
}: SearchResultsProps) => {
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

  if (searchResults === null)
    return <SearchInfos>Veuillez sélectionner vos critères</SearchInfos>;

  if (searchResults.length === 0)
    return (
      <SearchInfos>
        Pas de résultat. Essayez avec un plus grand rayon de recherche...
      </SearchInfos>
    );

  return (
    <>
      {searchResults.map((searchResult) => (
        <EnterpriseSearchResult
          key={searchResult.id}
          searchResult={searchResult}
          onButtonClick={() =>
            dispatch({
              type: "CLICKED_OPEN",
              payload: {
                immersionOfferId: searchResult.id,
                contactId: searchResult.contactDetails?.id,
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

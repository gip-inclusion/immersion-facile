import React from "react";
import { FederatedIdentity } from "shared";
import { ShareActions } from "src/app/pages/Convention/ConventionFields/ShareActions";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";
import { useConventionTextsFromFormikContext } from "../../../texts/textSetup";
import { EstablishementMentorFields } from "./EstablishementMentorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";

type EstablishmentFormSectionParams = {
  isFrozen: boolean | undefined;
  federatedIdentity: FederatedIdentity | undefined;
};

export const EstablishmentFormSection = ({
  isFrozen,
  federatedIdentity,
}: EstablishmentFormSectionParams): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <FormSectionTitle>
        {t.sectionTitles.establishment}
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={federatedIdentity}
        />
      </FormSectionTitle>
      <h4>{t.establishment.subtitle}</h4>
      <EstablishmentBusinessFields disabled={isFrozen} />
      <EstablishementMentorFields disabled={isFrozen} />
      <EstablishmentRepresentativeFields disabled={isFrozen} />
    </>
  );
};

import React from "react";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";
import { useConventionTextsFromFormikContext } from "../../texts/textSetup";
import { BeneficiaryCommonFields } from "../BeneficiaryCommonFields";

type beneficiaryFormSectionProperties = {
  isFrozen: boolean | undefined;
};
export const BeneficiaryFormSection = ({
  isFrozen,
}: beneficiaryFormSectionProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <FormSectionTitle>{t.sectionTitles.beneficiary}</FormSectionTitle>
      <BeneficiaryCommonFields disabled={isFrozen} />
    </>
  );
};

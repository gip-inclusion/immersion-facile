import React from "react";
import { getConventionFieldName } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { TextInput } from "src/uiComponents/form/TextInput";

export type BeneficiaryEmergencyContactFieldsProperties = {
  disabled: boolean | undefined;
};

export const BeneficiaryEmergencyContactFields = ({
  disabled,
}: BeneficiaryEmergencyContactFieldsProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <TextInput
        label={t.beneficiarySection.emergencyContact.nameLabel}
        name={getConventionFieldName(
          "signatories.beneficiary.emergencyContact",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiarySection.emergencyContact.phone.label}
        name={getConventionFieldName(
          "signatories.beneficiary.emergencyContactPhone",
        )}
        type="tel"
        placeholder={t.beneficiarySection.emergencyContact.phone.placeholder}
        description=""
        disabled={disabled}
      />
    </>
  );
};

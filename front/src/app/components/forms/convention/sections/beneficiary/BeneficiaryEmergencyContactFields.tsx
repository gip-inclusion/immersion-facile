import React from "react";
import { getConventionFieldName } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import { TextInput } from "src/app/components/forms/commons/TextInput";

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
      <TextInput
        label={t.beneficiarySection.emergencyContact.email.label}
        name={getConventionFieldName(
          "signatories.beneficiary.emergencyContactEmail",
        )}
        type="text"
        placeholder={t.beneficiarySection.emergencyContact.email.placeholder}
        description=""
        disabled={disabled}
      />
    </>
  );
};

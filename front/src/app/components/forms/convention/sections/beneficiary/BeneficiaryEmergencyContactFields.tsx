import React from "react";
import { ConventionDto } from "shared";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormikContext } from "formik";

export type BeneficiaryEmergencyContactFieldsProperties = {
  disabled: boolean | undefined;
};

export const BeneficiaryEmergencyContactFields = ({
  disabled,
}: BeneficiaryEmergencyContactFieldsProperties): JSX.Element => {
  const { values } = useFormikContext<ConventionDto>();

  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <TextInput
        {...formContents["signatories.beneficiary.emergencyContact"]}
        type="text"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.beneficiary.emergencyContactPhone"]}
        type="tel"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.beneficiary.emergencyContactEmail"]}
        type="text"
        disabled={disabled}
      />
    </>
  );
};

import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";

import { useFormContext } from "react-hook-form";
import { ConventionReadDto } from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  useFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";

export type BeneficiaryEmergencyContactFieldsProperties = {
  disabled: boolean | undefined;
};

export const BeneficiaryEmergencyContactFields = ({
  disabled,
}: BeneficiaryEmergencyContactFieldsProperties): JSX.Element => {
  const { watch, register, formState } = useFormContext<ConventionReadDto>();

  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(watch().internshipKind),
  );
  const getFieldError = makeFieldError(formState);
  const formContents = getFormFields();
  return (
    <>
      <Input
        {...formContents["signatories.beneficiary.emergencyContact"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.emergencyContact"],
          ...register("signatories.beneficiary.emergencyContact"),
        }}
        disabled={disabled}
        {...getFieldError("signatories.beneficiary.emergencyContact")}
      />
      <Input
        {...formContents["signatories.beneficiary.emergencyContactPhone"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.emergencyContactPhone"],
          ...register("signatories.beneficiary.emergencyContactPhone"),
        }}
        disabled={disabled}
        {...getFieldError("signatories.beneficiary.emergencyContactPhone")}
      />
      <Input
        {...formContents["signatories.beneficiary.emergencyContactEmail"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiary.emergencyContactEmail"],
          ...register("signatories.beneficiary.emergencyContactEmail"),
        }}
        disabled={disabled}
        {...getFieldError("signatories.beneficiary.emergencyContactEmail")}
      />
    </>
  );
};

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ConventionReadDto } from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";

export const BeneficiaryEmergencyContactFields = (): JSX.Element => {
  const { watch, register, formState } = useFormContext<ConventionReadDto>();

  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(watch().internshipKind),
  );
  const getFieldError = makeFieldError(formState);
  const formContents = getFormFields();
  return (
    <>
      <Input
        label={formContents["signatories.beneficiary.emergencyContact"].label}
        hintText={
          formContents["signatories.beneficiary.emergencyContact"].hintText
        }
        nativeInputProps={{
          ...formContents["signatories.beneficiary.emergencyContact"],
          ...register("signatories.beneficiary.emergencyContact"),
        }}
        {...getFieldError("signatories.beneficiary.emergencyContact")}
      />
      <Input
        label={
          formContents["signatories.beneficiary.emergencyContactPhone"].label
        }
        hintText={
          formContents["signatories.beneficiary.emergencyContactPhone"].hintText
        }
        nativeInputProps={{
          ...formContents["signatories.beneficiary.emergencyContactPhone"],
          ...register("signatories.beneficiary.emergencyContactPhone"),
        }}
        {...getFieldError("signatories.beneficiary.emergencyContactPhone")}
      />
      <Input
        label={
          formContents["signatories.beneficiary.emergencyContactEmail"].label
        }
        hintText={
          formContents["signatories.beneficiary.emergencyContactEmail"].hintText
        }
        nativeInputProps={{
          ...formContents["signatories.beneficiary.emergencyContactEmail"],
          ...register("signatories.beneficiary.emergencyContactEmail"),
        }}
        {...getFieldError("signatories.beneficiary.emergencyContactEmail")}
      />
    </>
  );
};

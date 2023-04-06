import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { ConventionReadDto } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";

type BeneficiaryRepresentativeFieldsProps = { disabled?: boolean };

export const BeneficiaryRepresentativeFields = ({
  disabled,
}: BeneficiaryRepresentativeFieldsProps) => {
  const { register, getValues, setValue, watch, formState } =
    useFormContext<ConventionReadDto>();
  const values = getValues();
  const currentValues = watch();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const beneficiaryRepresentativeFirstName =
    currentValues.signatories.beneficiaryRepresentative?.firstName;
  const beneficiaryRepresentativeLastName =
    currentValues.signatories.beneficiaryRepresentative?.lastName;
  const beneficiaryRepresentativePhone =
    currentValues.signatories.beneficiaryRepresentative?.phone;
  const getFieldError = makeFieldError(formState);

  useEffect(() => {
    setValue(
      "signatories.beneficiary.emergencyContact",
      [beneficiaryRepresentativeFirstName, beneficiaryRepresentativeLastName]
        .filter((v) => !!v)
        .join(" ") || undefined,
    );
  }, [beneficiaryRepresentativeFirstName, beneficiaryRepresentativeLastName]);

  useEffect(() => {
    setValue(
      "signatories.beneficiary.emergencyContactPhone",
      beneficiaryRepresentativePhone || "",
    );
  }, [beneficiaryRepresentativePhone]);

  const formContents = getFormFields();
  return (
    <>
      <Input
        {...formContents["signatories.beneficiaryRepresentative.firstName"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiaryRepresentative.firstName"],
          ...register("signatories.beneficiaryRepresentative.firstName"),
        }}
        disabled={disabled}
        {...getFieldError("signatories.beneficiaryRepresentative.firstName")}
      />
      <Input
        {...formContents["signatories.beneficiaryRepresentative.lastName"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiaryRepresentative.lastName"],
          ...register("signatories.beneficiaryRepresentative.lastName"),
        }}
        disabled={disabled}
        {...getFieldError("signatories.beneficiaryRepresentative.lastName")}
      />
      <EmailValidationInput
        {...formContents["signatories.beneficiaryRepresentative.email"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiaryRepresentative.email"],
          ...register("signatories.beneficiaryRepresentative.email"),
        }}
        {...getFieldError("signatories.beneficiaryRepresentative.email")}
        onEmailValidationFeedback={(emailStatus) => {
          // eslint-disable-next-line no-console
          console.log({ emailStatus });
        }}
      />
      {values.signatories.beneficiaryRepresentative?.email && (
        <ConventionEmailWarning />
      )}
      <Input
        {...formContents["signatories.beneficiaryRepresentative.phone"]}
        nativeInputProps={{
          ...formContents["signatories.beneficiaryRepresentative.phone"],
          ...register("signatories.beneficiaryRepresentative.phone"),
          type: "tel",
        }}
        disabled={disabled}
        {...getFieldError("signatories.beneficiaryRepresentative.phone")}
      />
    </>
  );
};

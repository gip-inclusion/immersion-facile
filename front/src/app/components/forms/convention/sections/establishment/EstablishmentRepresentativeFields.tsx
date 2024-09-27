import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useSelector } from "react-redux";
import { ConventionReadDto } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import {
  EmailValidationErrorsState,
  SetEmailValidationErrorsState,
} from "src/app/components/forms/convention/ConventionForm";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";

export const EstablishmentRepresentativeFields = ({
  setEmailValidationErrors,
  emailValidationErrors,
}: {
  setEmailValidationErrors: SetEmailValidationErrorsState;
  emailValidationErrors: EmailValidationErrorsState;
}): JSX.Element => {
  const { getValues, register, formState } =
    useFormContext<ConventionReadDto>();
  const values = getValues();
  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const getFieldError = makeFieldError(formState);
  const formContents = getFormFields();
  const isFetchingSiret = useSelector(siretSelectors.isFetching);
  return (
    <>
      <hr className={fr.cx("fr-hr")} />
      <Input
        label={
          formContents["signatories.establishmentRepresentative.firstName"]
            .label
        }
        hintText={
          formContents["signatories.establishmentRepresentative.firstName"]
            .hintText
        }
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.firstName"],
          ...register("signatories.establishmentRepresentative.firstName"),
        }}
        disabled={isFetchingSiret}
        {...getFieldError("signatories.establishmentRepresentative.firstName")}
      />
      <Input
        label={
          formContents["signatories.establishmentRepresentative.lastName"].label
        }
        hintText={
          formContents["signatories.establishmentRepresentative.lastName"]
            .hintText
        }
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.lastName"],
          ...register("signatories.establishmentRepresentative.lastName"),
        }}
        disabled={isFetchingSiret}
        {...getFieldError("signatories.establishmentRepresentative.lastName")}
      />
      <Input
        label={
          formContents["signatories.establishmentRepresentative.phone"].label
        }
        hintText={
          formContents["signatories.establishmentRepresentative.phone"].hintText
        }
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.phone"],
          ...register("signatories.establishmentRepresentative.phone"),
          type: "tel",
        }}
        disabled={isFetchingSiret}
        {...getFieldError("signatories.establishmentRepresentative.phone")}
      />
      <EmailValidationInput
        label={
          formContents["signatories.establishmentRepresentative.email"].label
        }
        hintText={
          formContents["signatories.establishmentRepresentative.email"].hintText
        }
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.email"],
          ...register("signatories.establishmentRepresentative.email"),
        }}
        disabled={isFetchingSiret}
        onEmailValidationFeedback={({ state, stateRelatedMessage }) => {
          const { "Responsable d'entreprise": _, ...rest } =
            emailValidationErrors;

          setEmailValidationErrors({
            ...rest,
            ...(state === "error"
              ? {
                  "Responsable d'entreprise": stateRelatedMessage,
                }
              : {}),
          });
        }}
      />
      {values.signatories.establishmentRepresentative?.email && (
        <ConventionEmailWarning />
      )}
    </>
  );
};

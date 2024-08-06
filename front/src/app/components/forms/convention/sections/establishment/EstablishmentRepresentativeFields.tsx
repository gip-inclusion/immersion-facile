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
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";

export const EstablishmentRepresentativeFields = ({
  setEmailValidationErrors,
  emailValidationErrors,
}: {
  setEmailValidationErrors: SetEmailValidationErrorsState;
  emailValidationErrors: EmailValidationErrorsState;
}): JSX.Element => {
  const { getValues, register } = useFormContext<ConventionReadDto>();
  const values = getValues();
  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  const isFetchingSiret = useSelector(siretSelectors.isFetching);
  return (
    <>
      <hr className={fr.cx("fr-hr")} />
      <Input
        {...formContents["signatories.establishmentRepresentative.firstName"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.firstName"],
          ...register("signatories.establishmentRepresentative.firstName"),
        }}
        disabled={isFetchingSiret}
      />
      <Input
        {...formContents["signatories.establishmentRepresentative.lastName"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.lastName"],
          ...register("signatories.establishmentRepresentative.lastName"),
        }}
        disabled={isFetchingSiret}
      />
      <Input
        {...formContents["signatories.establishmentRepresentative.phone"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.phone"],
          ...register("signatories.establishmentRepresentative.phone"),
          type: "tel",
        }}
        disabled={isFetchingSiret}
      />
      <EmailValidationInput
        {...formContents["signatories.establishmentRepresentative.email"]}
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

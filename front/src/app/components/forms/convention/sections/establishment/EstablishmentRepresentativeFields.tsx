import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useSelector } from "react-redux";
import { ConventionDto } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";

export const EstablishmentRepresentativeFields = (): JSX.Element => {
  const { getValues, register } = useFormContext<ConventionDto>();
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
      />
      {values.signatories.establishmentRepresentative?.email && (
        <ConventionEmailWarning />
      )}
    </>
  );
};

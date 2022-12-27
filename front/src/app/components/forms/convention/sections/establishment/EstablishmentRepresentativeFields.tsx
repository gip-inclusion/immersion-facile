import { useFormikContext } from "formik";
import React from "react";
import { ConventionDto } from "shared";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";

type EstablishmentRepresentativeFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishmentRepresentativeFields = ({
  disabled,
}: EstablishmentRepresentativeFieldsProperties): JSX.Element => {
  const { values } = useFormikContext<ConventionDto>();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <TextInput
        {...formContents["signatories.establishmentRepresentative.firstName"]}
        type="text"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.establishmentRepresentative.lastName"]}
        type="text"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.establishmentRepresentative.phone"]}
        type="tel"
        disabled={disabled}
      />
      <TextInput
        {...formContents["signatories.establishmentRepresentative.email"]}
        type="email"
        disabled={disabled}
      />
      {values.signatories.establishmentRepresentative?.email && (
        <ConventionEmailWarning />
      )}
    </>
  );
};

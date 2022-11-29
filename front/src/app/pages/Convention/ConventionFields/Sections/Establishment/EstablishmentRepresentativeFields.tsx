import { useFormikContext } from "formik";
import React from "react";
import { ConventionDto, getConventionFieldName } from "shared";
import { TextInput } from "src/uiComponents/form/TextInput";
import { useConventionTextsFromFormikContext } from "../../../texts/textSetup";
import { ConventionEmailWarning } from "../../../ConventionEmailWarning";

type EstablishmentRepresentativeFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishmentRepresentativeFields = ({
  disabled,
}: EstablishmentRepresentativeFieldsProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  const { values } = useFormikContext<ConventionDto>();
  return (
    <>
      <TextInput
        label={`${t.establishmentSection.establishmentRepresentative.firstName.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.firstName",
        )}
        type="text"
        placeholder=""
        description={
          t.establishmentSection.establishmentRepresentative.firstName
            .description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentRepresentative.lastName.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.lastName",
        )}
        type="text"
        placeholder=""
        description={
          t.establishmentSection.establishmentRepresentative.lastName
            .description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentRepresentative.phone.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.phone",
        )}
        type="tel"
        placeholder={
          t.establishmentSection.establishmentRepresentative.phone.placeholder
        }
        description={
          t.establishmentSection.establishmentRepresentative.phone.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentRepresentative.email.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.email",
        )}
        type="email"
        placeholder={
          t.establishmentSection.establishmentRepresentative.email.placeholder
        }
        description={
          t.establishmentSection.establishmentRepresentative.email.description
        }
        disabled={disabled}
      />
      {values.signatories.establishmentRepresentative?.email && (
        <ConventionEmailWarning />
      )}
    </>
  );
};

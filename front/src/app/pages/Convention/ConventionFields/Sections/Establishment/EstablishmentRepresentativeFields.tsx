import React from "react";
import { getConventionFieldName } from "shared";
import { TextInput } from "src/uiComponents/form/TextInput";
import { useConventionTextsFromFormikContext } from "../../../texts/textSetup";

type EstablishmentRepresentativeFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishmentRepresentativeFields = ({
  disabled,
}: EstablishmentRepresentativeFieldsProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <TextInput
        label={`${t.establishment.establishmentRepresentative.firstName.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.firstName",
        )}
        type="text"
        placeholder=""
        description={
          t.establishment.establishmentRepresentative.firstName.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.establishmentRepresentative.lastName.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.lastName",
        )}
        type="text"
        placeholder=""
        description={
          t.establishment.establishmentRepresentative.lastName.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.establishmentRepresentative.phone.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.phone",
        )}
        type="tel"
        placeholder={
          t.establishment.establishmentRepresentative.phone.placeholder
        }
        description={
          t.establishment.establishmentRepresentative.phone.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.establishmentRepresentative.email.label} *`}
        name={getConventionFieldName(
          "signatories.establishmentRepresentative.email",
        )}
        type="email"
        placeholder={
          t.establishment.establishmentRepresentative.email.placeholder
        }
        description={
          t.establishment.establishmentRepresentative.email.description
        }
        disabled={disabled}
      />
    </>
  );
};

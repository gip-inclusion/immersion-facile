import React from "react";
import { getConventionFieldName } from "shared";
import { RadioGroup } from "src/app/components/RadioGroup";
import { isEstablishmentTutorIsEstablishmentRepresentativeHook } from "src/hooks/convention.hooks";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { TextInput } from "src/uiComponents/form/TextInput";
import { useConventionTextsFromFormikContext } from "../../../texts/textSetup";

type EstablishmentRepresentativeFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishmentRepresentativeFields = ({
  disabled,
}: EstablishmentRepresentativeFieldsProperties): JSX.Element => {
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const {
    isEstablishmentTutorIsEstablishmentRepresentative,
    setIsEstablishmentTutorIsEstablishmentRepresentative,
  } = isEstablishmentTutorIsEstablishmentRepresentativeHook();
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <RadioGroup
        id="is-establishmentRepresentative"
        disabled={disabled}
        currentValue={isEstablishmentTutorIsEstablishmentRepresentative}
        setCurrentValue={setIsEstablishmentTutorIsEstablishmentRepresentative}
        groupLabel={`${t.establishment.isEstablishmentTutorIsEstablishmentRepresentative} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      {!isEstablishmentTutorIsEstablishmentRepresentative && (
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
            disabled={disabled || isFetchingSiret}
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
            disabled={disabled || isFetchingSiret}
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
            disabled={disabled || isFetchingSiret}
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
            disabled={disabled || isFetchingSiret}
            className="!mb-1"
          />
        </>
      )}
    </>
  );
};

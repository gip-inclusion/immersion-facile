import React from "react";
import { getConventionFieldName } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { TextInput } from "src/uiComponents/form/TextInput";

type EstablishementTutorFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishementTutorFields = ({
  disabled,
}: EstablishementTutorFieldsProperties): JSX.Element => {
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <TextInput
        label={`${t.establishment.establishmentTutor.firstName.label} *`}
        name={getConventionFieldName("establishmentTutor.firstName")}
        type="text"
        placeholder=""
        description={t.establishment.establishmentTutor.firstName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.establishmentTutor.lastName.label} *`}
        name={getConventionFieldName("establishmentTutor.lastName")}
        type="text"
        placeholder=""
        description={t.establishment.establishmentTutor.lastName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.establishmentTutor.job.label} *`}
        name={getConventionFieldName("establishmentTutor.job")}
        type="text"
        placeholder=""
        description={t.establishment.establishmentTutor.job.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.establishmentTutor.phone.label} *`}
        name={getConventionFieldName("establishmentTutor.phone")}
        type="tel"
        placeholder={t.establishment.establishmentTutor.phone.placeholder}
        description={t.establishment.establishmentTutor.phone.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.establishmentTutor.email.label} *`}
        name={getConventionFieldName("establishmentTutor.email")}
        type="email"
        placeholder={t.establishment.establishmentTutor.email.placeholder}
        description={t.establishment.establishmentTutor.email.description}
        disabled={disabled}
      />
    </>
  );
};

import React from "react";
import { getConventionFieldName } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { TextInput } from "src/uiComponents/form/TextInput";

type EstablishementMentorFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishementMentorFields = ({
  disabled,
}: EstablishementMentorFieldsProperties): JSX.Element => {
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <TextInput
        label={`${t.establishment.mentor.firstName.label} *`}
        name={getConventionFieldName("mentor.firstName")}
        type="text"
        placeholder=""
        description={t.establishment.mentor.firstName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.mentor.lastName.label} *`}
        name={getConventionFieldName("mentor.lastName")}
        type="text"
        placeholder=""
        description={t.establishment.mentor.lastName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.mentor.job.label} *`}
        name={getConventionFieldName("mentor.job")}
        type="text"
        placeholder=""
        description={t.establishment.mentor.job.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.mentor.phone.label} *`}
        name={getConventionFieldName("mentor.phone")}
        type="tel"
        placeholder={t.establishment.mentor.phone.placeholder}
        description={t.establishment.mentor.phone.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.mentor.email.label} *`}
        name={getConventionFieldName("mentor.email")}
        type="email"
        placeholder={t.establishment.mentor.email.placeholder}
        description={t.establishment.mentor.email.description}
        disabled={disabled}
        className="!mb-1"
      />
    </>
  );
};

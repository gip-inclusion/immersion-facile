import { useFormikContext } from "formik";
import React from "react";
import { ConventionDto, getConventionFieldName } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { TextInput } from "src/uiComponents/form/TextInput";
import { ConventionEmailWarning } from "../../../ConventionEmailWarning";

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
  const { values } = useFormikContext<ConventionDto>();

  return (
    <>
      <TextInput
        label={`${t.establishmentSection.establishmentTutor.firstName.label} *`}
        name={getConventionFieldName("establishmentTutor.firstName")}
        type="text"
        placeholder=""
        description={
          t.establishmentSection.establishmentTutor.firstName.description
        }
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentTutor.lastName.label} *`}
        name={getConventionFieldName("establishmentTutor.lastName")}
        type="text"
        placeholder=""
        description={
          t.establishmentSection.establishmentTutor.lastName.description
        }
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentTutor.job.label} *`}
        name={getConventionFieldName("establishmentTutor.job")}
        type="text"
        placeholder=""
        description={t.establishmentSection.establishmentTutor.job.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentTutor.phone.label} *`}
        name={getConventionFieldName("establishmentTutor.phone")}
        type="tel"
        placeholder={
          t.establishmentSection.establishmentTutor.phone.placeholder
        }
        description={
          t.establishmentSection.establishmentTutor.phone.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishmentSection.establishmentTutor.email.label} *`}
        name={getConventionFieldName("establishmentTutor.email")}
        type="email"
        placeholder={
          t.establishmentSection.establishmentTutor.email.placeholder
        }
        description={
          t.establishmentSection.establishmentTutor.email.description
        }
        disabled={disabled}
      />
      {values.establishmentTutor?.email && <ConventionEmailWarning />}
    </>
  );
};

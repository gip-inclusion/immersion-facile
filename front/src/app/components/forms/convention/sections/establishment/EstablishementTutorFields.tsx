import { useFormikContext } from "formik";
import React from "react";
import { ConventionDto } from "shared";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";

type EstablishementTutorFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishementTutorFields = ({
  disabled,
}: EstablishementTutorFieldsProperties): JSX.Element => {
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const { values } = useFormikContext<ConventionDto>();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <TextInput
        {...formContents["establishmentTutor.firstName"]}
        type="text"
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        {...formContents["establishmentTutor.lastName"]}
        type="text"
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        {...formContents["establishmentTutor.job"]}
        type="text"
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        {...formContents["establishmentTutor.phone"]}
        type="tel"
        disabled={disabled}
      />
      <TextInput
        {...formContents["establishmentTutor.email"]}
        type="email"
        disabled={disabled}
      />
      {values.establishmentTutor?.email && <ConventionEmailWarning />}
    </>
  );
};

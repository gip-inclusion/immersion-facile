import React from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFormContext } from "react-hook-form";
import { ConventionDto } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  useFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";

type EstablishementTutorFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishementTutorFields = ({
  disabled,
}: EstablishementTutorFieldsProperties): JSX.Element => {
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const { register, getValues, formState } = useFormContext<ConventionDto>();
  const values = getValues();
  const getFieldError = makeFieldError(formState);
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <Input
        {...formContents["establishmentTutor.firstName"]}
        nativeInputProps={{
          ...formContents["establishmentTutor.firstName"],
          ...register("establishmentTutor.firstName"),
        }}
        disabled={disabled || isFetchingSiret}
        {...getFieldError("establishmentTutor.firstName")}
      />
      <Input
        {...formContents["establishmentTutor.lastName"]}
        nativeInputProps={{
          ...formContents["establishmentTutor.lastName"],
          ...register("establishmentTutor.lastName"),
        }}
        disabled={disabled || isFetchingSiret}
        {...getFieldError("establishmentTutor.lastName")}
      />
      <Input
        {...formContents["establishmentTutor.job"]}
        nativeInputProps={{
          ...formContents["establishmentTutor.job"],
          ...register("establishmentTutor.job"),
        }}
        disabled={disabled || isFetchingSiret}
        {...getFieldError("establishmentTutor.job")}
      />
      <Input
        {...formContents["establishmentTutor.phone"]}
        nativeInputProps={{
          ...formContents["establishmentTutor.phone"],
          ...register("establishmentTutor.phone"),
          type: "tel",
        }}
        disabled={disabled}
        {...getFieldError("establishmentTutor.phone")}
      />
      <EmailValidationInput
        {...formContents["establishmentTutor.email"]}
        nativeInputProps={{
          ...formContents["establishmentTutor.email"],
          ...register("establishmentTutor.email"),
        }}
        {...getFieldError("establishmentTutor.email")}
        disabled={disabled}
      />
      {values.establishmentTutor?.email && <ConventionEmailWarning />}
    </>
  );
};

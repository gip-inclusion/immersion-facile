import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ConventionDto } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";

export const EstablishementTutorFields = (): JSX.Element => {
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
        label={formContents["establishmentTutor.firstName"].label}
        hintText={formContents["establishmentTutor.firstName"].hintText}
        nativeInputProps={{
          ...formContents["establishmentTutor.firstName"],
          ...register("establishmentTutor.firstName"),
        }}
        disabled={isFetchingSiret}
        {...getFieldError("establishmentTutor.firstName")}
      />
      <Input
        label={formContents["establishmentTutor.lastName"].label}
        hintText={formContents["establishmentTutor.lastName"].hintText}
        nativeInputProps={{
          ...formContents["establishmentTutor.lastName"],
          ...register("establishmentTutor.lastName"),
        }}
        disabled={isFetchingSiret}
        {...getFieldError("establishmentTutor.lastName")}
      />
      <Input
        label={formContents["establishmentTutor.job"].label}
        hintText={formContents["establishmentTutor.job"].hintText}
        nativeInputProps={{
          ...formContents["establishmentTutor.job"],
          ...register("establishmentTutor.job"),
        }}
        disabled={isFetchingSiret}
        {...getFieldError("establishmentTutor.job")}
      />
      <Input
        label={formContents["establishmentTutor.phone"].label}
        hintText={formContents["establishmentTutor.phone"].hintText}
        nativeInputProps={{
          ...formContents["establishmentTutor.phone"],
          ...register("establishmentTutor.phone"),
          type: "tel",
        }}
        {...getFieldError("establishmentTutor.phone")}
      />
      <EmailValidationInput
        label={formContents["establishmentTutor.email"].label}
        hintText={formContents["establishmentTutor.email"].hintText}
        nativeInputProps={{
          ...formContents["establishmentTutor.email"],
          ...register("establishmentTutor.email"),
        }}
        {...getFieldError("establishmentTutor.email")}
      />
      {values.establishmentTutor?.email && <ConventionEmailWarning />}
    </>
  );
};

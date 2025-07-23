import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";
import { useSelector } from "react-redux";
import { type ConventionReadDto, toLowerCaseWithoutDiacritics } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import type {
  EmailValidationErrorsState,
  SetEmailValidationErrorsState,
} from "src/app/components/forms/convention/ConventionForm";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { EmailValidationInput } from "../../../commons/EmailValidationInput";
import { PhoneInput } from "../../../commons/PhoneInput";

export const EstablishementTutorFields = ({
  setEmailValidationErrors,
  emailValidationErrors,
  isTutorEstablishmentRepresentative,
}: {
  setEmailValidationErrors: SetEmailValidationErrorsState;
  emailValidationErrors: EmailValidationErrorsState;
  isTutorEstablishmentRepresentative: boolean;
}): JSX.Element => {
  const { register, getValues, formState, setValue } =
    useFormContext<ConventionReadDto>();
  const values = getValues();
  const getFieldError = makeFieldError(formState);
  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  const isFetchingSiret = useSelector(siretSelectors.isFetching);
  return (
    <>
      {!isTutorEstablishmentRepresentative && (
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
          <PhoneInput
            label={formContents["establishmentTutor.phone"].label}
            hintText={formContents["establishmentTutor.phone"].hintText}
            inputProps={{
              ...formContents["establishmentTutor.phone"],
              nativeInputProps: {
                ...register("establishmentTutor.phone"),
                id: formContents["establishmentTutor.phone"].id,
              },
            }}
            onPhoneNumberChange={(phoneNumber) => {
              setValue("establishmentTutor.phone", phoneNumber);
            }}
            disabled={isFetchingSiret}
            {...getFieldError("establishmentTutor.phone")}
            shouldDisplaySelect={true}
          />
          <EmailValidationInput
            label={formContents["establishmentTutor.email"].label}
            hintText={formContents["establishmentTutor.email"].hintText}
            nativeInputProps={{
              ...formContents["establishmentTutor.email"],
              ...register("establishmentTutor.email", {
                setValueAs: (value) => toLowerCaseWithoutDiacritics(value),
              }),
              onBlur: (event) => {
                setValue(
                  "establishmentTutor.email",
                  toLowerCaseWithoutDiacritics(event.currentTarget.value),
                );
              },
            }}
            {...getFieldError("establishmentTutor.email")}
            onEmailValidationFeedback={({ state, stateRelatedMessage }) => {
              const { "Tuteur de l'entreprise": _, ...rest } =
                emailValidationErrors;

              setEmailValidationErrors({
                ...rest,
                ...(state === "error"
                  ? {
                      "Tuteur de l'entreprise": stateRelatedMessage,
                    }
                  : {}),
              });
            }}
          />
          {values.establishmentTutor?.email && <ConventionEmailWarning />}
        </>
      )}
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
    </>
  );
};

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";
import {
  type ConventionDto,
  addressDtoToString,
  toLowerCaseWithoutDiacritics,
} from "shared";
import { EmailValidationInput } from "src/app/components/forms/commons/EmailValidationInput";
import type {
  EmailValidationErrorsState,
  SetEmailValidationErrorsState,
} from "src/app/components/forms/convention/ConventionForm";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { AddressAutocomplete } from "../../../autocomplete/AddressAutocomplete";

export const BeneficiaryCurrentEmployerFields = ({
  setEmailValidationErrors,
  emailValidationErrors,
}: {
  setEmailValidationErrors: SetEmailValidationErrorsState;
  emailValidationErrors: EmailValidationErrorsState;
}): JSX.Element => {
  const { setValue, getValues, register, formState } =
    useFormContext<ConventionDto>();
  const values = getValues();
  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formFields = getFormFields();
  const getFieldError = makeFieldError(formState);

  return (
    <>
      <Alert
        severity="info"
        title="Accord de l'employeur"
        className={fr.cx("fr-mb-2w")}
        description={
          <>
            <p>
              <strong>
                Si l'immersion se fait en dehors du temps de travail, l'accord
                de l'employeur n'est pas nécessaire.
              </strong>
            </p>
            <p>
              Le bénéficiaire peut effectuer son immersion sur son temps de
              travail. Dans ce cas, l’accord de son employeur actuel est
              nécessaire. Le contrat de travail n’est pas suspendu et
              l’employeur actuel couvre le risque accident du travail pendant la
              durée de l’immersion.
            </p>
          </>
        }
      />

      <Input
        label={
          formFields["signatories.beneficiaryCurrentEmployer.businessSiret"]
            .label
        }
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.businessSiret"]
            .hintText
        }
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.businessSiret"],
          ...register("signatories.beneficiaryCurrentEmployer.businessSiret"),
        }}
        {...getFieldError(
          "signatories.beneficiaryCurrentEmployer.businessSiret",
        )}
      />
      <Input
        label={
          formFields["signatories.beneficiaryCurrentEmployer.businessName"]
            .label
        }
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.businessName"]
            .hintText
        }
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.businessName"],
          ...register("signatories.beneficiaryCurrentEmployer.businessName"),
        }}
        {...getFieldError(
          "signatories.beneficiaryCurrentEmployer.businessName",
        )}
      />
      <AddressAutocomplete
        locator="conventionBeneficiaryCurrentEmployerAddress"
        label={
          formFields["signatories.beneficiaryCurrentEmployer.businessAddress"]
            .label
        }
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.businessAddress"]
            .hintText
        }
        initialInputValue={
          values.signatories.beneficiaryCurrentEmployer?.businessAddress
        }
        selectProps={{
          inputId:
            formFields["signatories.beneficiaryCurrentEmployer.businessAddress"]
              .id,
        }}
        onAddressSelected={(addressAndPosition) => {
          setValue(
            "signatories.beneficiaryCurrentEmployer.businessAddress",
            addressDtoToString(addressAndPosition.address),
          );
        }}
        onAddressClear={() => {
          setValue(
            "signatories.beneficiaryCurrentEmployer.businessAddress",
            "",
          );
        }}
        {...getFieldError(
          "signatories.beneficiaryCurrentEmployer.businessAddress",
        )}
      />
      <Input
        label={
          formFields["signatories.beneficiaryCurrentEmployer.firstName"].label
        }
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.firstName"]
            .hintText
        }
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.firstName"],
          ...register("signatories.beneficiaryCurrentEmployer.firstName"),
        }}
        {...getFieldError("signatories.beneficiaryCurrentEmployer.firstName")}
      />
      <Input
        label={
          formFields["signatories.beneficiaryCurrentEmployer.lastName"].label
        }
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.lastName"].hintText
        }
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.lastName"],
          ...register("signatories.beneficiaryCurrentEmployer.lastName"),
        }}
        {...getFieldError("signatories.beneficiaryCurrentEmployer.lastName")}
      />
      <Input
        label={formFields["signatories.beneficiaryCurrentEmployer.job"].label}
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.job"].hintText
        }
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.job"],
          ...register("signatories.beneficiaryCurrentEmployer.job"),
        }}
        {...getFieldError("signatories.beneficiaryCurrentEmployer.job")}
      />
      <Input
        label={formFields["signatories.beneficiaryCurrentEmployer.phone"].label}
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.phone"].hintText
        }
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.phone"],
          ...register("signatories.beneficiaryCurrentEmployer.phone"),
        }}
        {...getFieldError("signatories.beneficiaryCurrentEmployer.phone")}
      />
      <EmailValidationInput
        hintText={
          formFields["signatories.beneficiaryCurrentEmployer.email"].hintText
        }
        label={formFields["signatories.beneficiaryCurrentEmployer.email"].label}
        nativeInputProps={{
          ...formFields["signatories.beneficiaryCurrentEmployer.email"],
          ...register("signatories.beneficiaryCurrentEmployer.email", {
            setValueAs: (value) => toLowerCaseWithoutDiacritics(value),
          }),
          onBlur: (event) => {
            setValue(
              "signatories.beneficiaryCurrentEmployer.email",
              toLowerCaseWithoutDiacritics(event.currentTarget.value),
            );
          },
        }}
        {...getFieldError("signatories.beneficiaryCurrentEmployer.email")}
        onEmailValidationFeedback={({ state, stateRelatedMessage }) => {
          const { "Employeur actuel du bénéficiaire": _, ...rest } =
            emailValidationErrors;

          setEmailValidationErrors({
            ...rest,
            ...(state === "error"
              ? {
                  "Employeur actuel du bénéficiaire": stateRelatedMessage,
                }
              : {}),
          });
        }}
      />
    </>
  );
};

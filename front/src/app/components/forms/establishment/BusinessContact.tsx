import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import {
  RadioButtons,
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import { type UseFormRegisterReturn, useFormContext } from "react-hook-form";
import {
  type ContactFormEstablishmentUserRight,
  type FormEstablishmentDto,
  domElementIds,
  emailSchema,
} from "shared";
import { MultipleEmailsInput } from "src/app/components/forms/commons/MultipleEmailsInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { Mode } from "./EstablishmentForm";

const preferredContactModeOptions = (
  register: UseFormRegisterReturn<string>,
): RadioButtonsProps["options"] => [
  {
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
    nativeInputProps: {
      value: "EMAIL",
      ...register,
    },
  },
  {
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
    nativeInputProps: {
      value: "PHONE",
      ...register,
    },
  },
  {
    label: "Se présenter en personne à votre établissement",
    nativeInputProps: {
      value: "IN_PERSON",
      ...register,
    },
  },
];

export const BusinessContact = ({
  mode,
}: {
  mode: Mode;
}) => {
  const { getFormFields } = getFormContents(
    formEstablishmentFieldsLabels(mode),
  );
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const formContents = getFormFields();
  const { setValue, register, getValues, formState } =
    useFormContext<FormEstablishmentDto>();
  const getFieldError = makeFieldError<FormEstablishmentDto>(formState);

  const establishmentContactsEmails = getValues("userRights")
    .filter((userRight) => userRight.role === "establishment-contact")
    .map((userRight) => userRight.email);
  const establishmentAdminsRights = getValues("userRights").filter(
    (userRight) => userRight.role === "establishment-admin",
  );
  return (
    <>
      {mode === "create" && (
        <div className={fr.cx("fr-input-group")}>
          <h2 className={fr.cx("fr-text--lead")}>
            Qui répondra aux demandes des candidats ?
          </h2>
          {mode === "create" && (
            <>
              <Input
                label={"Prénom du référent"}
                hintText={
                  "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
                }
                disabled
                nativeInputProps={{
                  value: federatedIdentity?.firstName,
                  id: domElementIds.establishment[mode].businessContact
                    .firstName,
                }}
              />
              <Input
                label={"Nom du référent"}
                hintText={
                  "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
                }
                disabled
                nativeInputProps={{
                  value: federatedIdentity?.lastName,
                  id: domElementIds.establishment[mode].businessContact
                    .lastName,
                }}
              />
            </>
          )}
          <Input
            label={"Email du référent"}
            hintText={
              "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
            }
            disabled={mode === "create"}
            nativeInputProps={{
              ...register("userRights.0.email"),
              value: getValues("userRights.0.email"),
              id: domElementIds.establishment[mode].businessContact.email,
            }}
          />
          <Input
            label={formContents["userRights.0.job"].label}
            hintText={formContents["userRights.0.job"].hintText}
            nativeInputProps={{
              ...formContents["userRights.0.job"],
              ...register("userRights.0.job"),
              defaultValue: getValues("userRights.0.job"),
              id: domElementIds.establishment[mode].businessContact.job,
            }}
            {...getFieldError("userRights.0.job")}
          />
          <Input
            label={formContents["userRights.0.phone"].label}
            hintText={formContents["userRights.0.phone"].hintText}
            nativeInputProps={{
              ...formContents["userRights.0.phone"],
              ...register("userRights.0.phone"),
              defaultValue: getValues("userRights.0.phone"),
              id: domElementIds.establishment[mode].businessContact.phone,
            }}
            {...getFieldError("userRights.0.phone")}
          />

          <MultipleEmailsInput
            {...formContents.userRights}
            valuesInList={establishmentContactsEmails}
            initialValue={establishmentContactsEmails.join(", ")}
            setValues={(newValues) => {
              setValue("userRights", [
                ...establishmentAdminsRights,
                ...newValues.map(
                  (email) =>
                    ({
                      email,
                      role: "establishment-contact",
                    }) satisfies ContactFormEstablishmentUserRight,
                ),
              ]);
            }}
            validationSchema={emailSchema}
          />
        </div>
      )}
      <RadioButtons
        {...formContents.contactMode}
        legend={formContents.contactMode.label}
        hintText={formContents.contactMode.hintText}
        {...register("contactMode")}
        options={preferredContactModeOptions(register("contactMode"))}
        {...getFieldError("contactMode")}
      />
    </>
  );
};

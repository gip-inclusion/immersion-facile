import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { values } from "ramda";
import { ErrorNotifications, HeadingSection } from "react-design-system";
import { useFormContext } from "react-hook-form";
import { domElementIds, type FormEstablishmentDto } from "shared";
import { CreationSiretRelatedInputs } from "src/app/components/forms/establishment/CreationSiretRelatedInputs";
import { EditionSiretRelatedInputs } from "src/app/components/forms/establishment/EditionSiretRelatedInputs";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { EstablishmentUsersList } from "src/app/pages/establishment-dashboard/EstablishmentUsersList";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { match, P } from "ts-pattern";
import type { Mode, OnStepChange, Step } from "../EstablishmentForm";

export const BusinessAndAdminSection = ({
  mode,
  currentStep,
  onStepChange,
}: {
  mode: Mode;
  currentStep: Step;
  onStepChange: OnStepChange;
}) => {
  const isStepMode = currentStep !== null;
  const methods = useFormContext<FormEstablishmentDto>();
  const {
    register,
    formState: { errors },
  } = methods;
  const getFieldError = makeFieldError(methods.formState);

  const formContents = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormFields();
  const formErrors = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormErrors();

  return (
    <>
      <HeadingSection
        title="Informations de votre établissement"
        className={fr.cx("fr-mt-0")}
      >
        {match(mode)
          .with("create", () => <CreationSiretRelatedInputs />)
          .with(P.union("admin", "edit"), () => (
            <EditionSiretRelatedInputs mode={mode} />
          ))
          .exhaustive()}
        <Input
          label={formContents.website.label}
          hintText={formContents.website.hintText}
          nativeInputProps={{
            ...formContents.website,
            ...register("website"),
          }}
          {...getFieldError("website")}
        />
        <Input
          label={formContents.additionalInformation.label}
          hintText={formContents.additionalInformation.hintText}
          textArea
          nativeTextAreaProps={{
            ...formContents.additionalInformation,
            ...register("additionalInformation"),
          }}
          {...getFieldError("additionalInformation")}
        />
      </HeadingSection>

      {match(mode)
        .with(P.union("edit", "admin"), () => <EstablishmentUsersList />)
        .with("create", () => (
          <HeadingSection title="Administrateurs de l'établissement">
            <EstablishmentAdminInfos />
          </HeadingSection>
        ))
        .exhaustive()}

      {isStepMode && (
        <>
          <ErrorNotifications
            errorsWithLabels={toErrorsWithLabels({
              labels: formErrors,
              errors: displayReadableError(errors),
            })}
            visible={values(errors).length > 0}
          />
          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="left"
            buttonsEquisized
            className={fr.cx("fr-mt-4w")}
            buttons={[
              {
                children: "Étape précédente",
                iconId: "fr-icon-arrow-left-line",
                priority: "secondary",
                disabled: true,
                id: domElementIds.establishment[
                  mode
                ].previousButtonFromStepAndMode({
                  currentStep,
                  mode,
                }),
              },
              {
                children: "Étape suivante",
                onClick: () => {
                  onStepChange(2, [
                    "siret",
                    "businessName",
                    "businessNameCustomized",
                    "website",
                    "additionalInformation",
                    "userRights.0.job",
                    "userRights.0.phone",
                    "userRights.0.email",
                  ]);
                },
                type: "button",
                iconId: "fr-icon-arrow-right-line",
                iconPosition: "right",
                id: domElementIds.establishment[mode].nextButtonFromStepAndMode(
                  {
                    currentStep,
                    mode,
                  },
                ),
              },
            ]}
          />
        </>
      )}
    </>
  );
};

const EstablishmentAdminInfos = () => {
  const methods = useFormContext<FormEstablishmentDto>();
  const { register } = methods;
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const formContents = getFormContents(
    formEstablishmentFieldsLabels("create"),
  ).getFormFields();
  const getFieldError = makeFieldError(methods.formState);
  return (
    <>
      <Alert
        className={fr.cx("fr-mb-2w")}
        severity="info"
        small
        description="L’administrateur accède aux conventions, aux candidatures et peut gérer la fiche entreprise et les utilisateurs de l’établissement. Vous pourrez ajouter d’autres utilisateurs à votre établissement une fois celui-ci créé."
      />
      {/* 
      
      TODO: federatedIdentity.provider === "proconnect" 
      when ready and add the "email" case so we redirect the user to its account 
      
      */}
      {federatedIdentity?.provider === "proConnect" && (
        <>
          <Input
            label={formContents["userRights.0.firstName"].label}
            hintText={
              "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
            }
            disabled
            nativeInputProps={{
              value: federatedIdentity?.firstName,
              id: domElementIds.establishment.create.businessContact.firstName,
            }}
          />
          <Input
            label={formContents["userRights.0.lastName"].label}
            hintText={
              "Ce champ est renseigné automatiquement depuis les données renseignées sur ProConnect"
            }
            disabled
            nativeInputProps={{
              value: federatedIdentity?.lastName,
              id: domElementIds.establishment.create.businessContact.lastName,
            }}
          />
        </>
      )}

      <Input
        label={formContents["userRights.0.email"].label}
        hintText={formContents["userRights.0.email"].hintText}
        disabled
        nativeInputProps={{
          value: federatedIdentity?.email,
          id: domElementIds.establishment.create.businessContact.email,
        }}
      />
      <Input
        label={formContents["userRights.0.job"].label}
        nativeInputProps={{
          ...formContents["userRights.0.job"],
          ...register("userRights.0.job"),
        }}
        {...getFieldError("userRights.0.job")}
      />
      <Input
        label={formContents["userRights.0.phone"].label}
        hintText={formContents["userRights.0.phone"].hintText}
        nativeInputProps={{
          ...formContents["userRights.0.phone"],
          ...register("userRights.0.phone"),
        }}
        {...getFieldError("userRights.0.phone")}
      />
    </>
  );
};

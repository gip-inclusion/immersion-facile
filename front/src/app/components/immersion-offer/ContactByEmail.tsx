import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select, { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  AppellationDto,
  ContactEstablishmentByMailDto,
  ImmersionObjective,
  OmitFromExistingKeys,
  contactEstablishmentByMailFormSchema,
  conventionObjectiveOptions,
  domElementIds,
  labelsForImmersionObjective,
} from "shared";
import { TranscientPreferencesDisplay } from "src/app/components/immersion-offer/TranscientPreferencesDisplay";
import { getDefaultAppellationCode } from "src/app/components/immersion-offer/contactUtils";
import {
  transcientExpirationTimeInMinutes,
  useTranscientDataFromStorage,
} from "src/app/components/immersion-offer/useTranscientDataFromStorage";
import { useContactEstablishmentError } from "src/app/components/search/useContactEstablishmentError";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes, useRoute } from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import { Route } from "type-route";
import { EmailValidationInput } from "../forms/commons/EmailValidationInput";

type ContactByEmailProps = {
  appellations: AppellationDto[];
  onSubmitSuccess: () => void;
};

export const inputsLabelsByKey: Record<
  keyof OmitFromExistingKeys<
    ContactEstablishmentByMailDto,
    | "siret"
    | "contactMode"
    | "locationId"
    | "acquisitionCampaign"
    | "acquisitionKeyword"
  >,
  string
> = {
  immersionObjective: "But de l'immersion *",
  appellationCode: "Métier sur lequel porte la demande d'immersion *",
  datePreferences: "Dates d'immersion envisagées *",
  potentialBeneficiaryFirstName: "Prénom *",
  potentialBeneficiaryLastName: "Nom *",
  potentialBeneficiaryEmail: "Email *",
  potentialBeneficiaryPhone: "Téléphone *",
  potentialBeneficiaryResumeLink: "Page LinkedIn ou CV en ligne (optionnel)",
  hasWorkingExperience: "Expérience professionnelle",
  experienceAdditionalInformation:
    "Détaillez en quelques lignes vos expériences et compétences *",
};

export const ContactByEmail = ({
  appellations,
  onSubmitSuccess,
}: ContactByEmailProps) => {
  const { activeError, setActiveErrorKind } = useContactEstablishmentError();
  const route = useRoute() as Route<typeof routes.searchResult>;

  const [invalidEmailMessage, setInvalidEmailMessage] =
    useState<React.ReactNode | null>(null);

  const {
    getTranscientDataForScope,
    setTranscientDataForScope,
    getPreferUseTranscientDataForScope,
  } = useTranscientDataFromStorage("contact-establishment", false);

  const formRef = useRef<HTMLFormElement>(null);

  const transcientDataForScope = getTranscientDataForScope();
  const preferUseTranscientData = getPreferUseTranscientDataForScope();
  const acquisitionParams = useGetAcquisitionParams();
  const initialValues = useMemo<ContactEstablishmentByMailDto>(
    () => ({
      siret: route.params.siret,
      appellationCode: getDefaultAppellationCode(
        appellations,
        route.params.appellationCode,
      ),
      contactMode: "EMAIL",
      datePreferences: "",
      hasWorkingExperience: false,
      potentialBeneficiaryFirstName: route.params.contactFirstName ?? "",
      potentialBeneficiaryLastName: route.params.contactLastName ?? "",
      potentialBeneficiaryEmail: route.params.contactEmail ?? "",
      immersionObjective: null,
      potentialBeneficiaryResumeLink: "",
      potentialBeneficiaryPhone: route.params.contactPhone ?? "",
      locationId: route.params.location ?? "",
      ...acquisitionParams,
      ...(preferUseTranscientData && transcientDataForScope?.value
        ? { ...transcientDataForScope.value }
        : {}),
      experienceAdditionalInformation: undefined,
    }),
    [
      appellations,
      route.params,
      preferUseTranscientData,
      transcientDataForScope,
      acquisitionParams,
    ],
  );

  const appellationListOfOptions = appellations.map((appellation) => ({
    value: appellation.appellationCode,
    label: appellation.appellationLabel,
  }));

  const methods = useForm<ContactEstablishmentByMailDto>({
    resolver: zodResolver(contactEstablishmentByMailFormSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });

  const {
    register,
    handleSubmit,
    formState,
    formState: { isSubmitting },
    reset,
    setValue,
    watch,
  } = methods;

  const hasWorkingExperienceValue = watch("hasWorkingExperience");

  const getFieldError = makeFieldError(formState);

  const onFormValid = async (values: ContactEstablishmentByMailDto) => {
    setTranscientDataForScope(values, transcientExpirationTimeInMinutes);
    const errorKind =
      await outOfReduxDependencies.searchGateway.contactEstablishment({
        ...values,
      });
    if (errorKind) return setActiveErrorKind(errorKind);
    onSubmitSuccess();
  };
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onFormValid, console.error)}
        id={"im-contact-form--email"}
        ref={formRef}
      >
        <TranscientPreferencesDisplay
          scope="contact-establishment"
          onPreferencesChange={(accept) => {
            const newInitialValues = accept
              ? {
                  ...initialValues,
                  ...transcientDataForScope?.value,
                }
              : initialValues;
            reset(newInitialValues);
          }}
          mode="form-overlay"
          parentRef={formRef}
        />
        <>
          <p>
            Cette entreprise a choisi d'être contactée par mail. Veuillez
            compléter ce formulaire qui sera transmis à l'entreprise.
          </p>
          <h2 className={fr.cx("fr-h6")}>Vos informations de contact</h2>
          <p className={fr.cx("fr-hint-text")}>
            Pour permettre à l’entreprise de vous recontacter.
          </p>
          <Input
            label={inputsLabelsByKey.potentialBeneficiaryFirstName}
            nativeInputProps={register("potentialBeneficiaryFirstName")}
            {...getFieldError("potentialBeneficiaryFirstName")}
          />
          <Input
            label={inputsLabelsByKey.potentialBeneficiaryLastName}
            nativeInputProps={register("potentialBeneficiaryLastName")}
            {...getFieldError("potentialBeneficiaryLastName")}
          />
          <EmailValidationInput
            label={inputsLabelsByKey.potentialBeneficiaryEmail}
            nativeInputProps={{
              ...register("potentialBeneficiaryEmail"),
            }}
            {...getFieldError("potentialBeneficiaryEmail")}
            onEmailValidationFeedback={({ state, stateRelatedMessage }) =>
              setInvalidEmailMessage(
                state === "error" ? stateRelatedMessage : null,
              )
            }
          />
          <Input
            label={inputsLabelsByKey.potentialBeneficiaryPhone}
            nativeInputProps={{
              ...register("potentialBeneficiaryPhone"),
              type: "phone",
            }}
            {...getFieldError("potentialBeneficiaryPhone")}
          />

          <h2 className={fr.cx("fr-h6", "fr-mt-3w")}>Votre immersion</h2>
          <p className={fr.cx("fr-hint-text")}>
            Donnez un maximum d’informations à l’entreprise pour qu’elle sache
            si elle est en capacité de vous accueillir.
          </p>
          <Select
            label={inputsLabelsByKey.immersionObjective}
            options={immersionObjectiveListOfOptions}
            placeholder={"But de l'immersion"}
            nativeSelectProps={{
              ...register("immersionObjective"),
            }}
            {...getFieldError("immersionObjective")}
          />
          <Select
            disabled={appellations.length === 1}
            label={inputsLabelsByKey.appellationCode}
            options={appellationListOfOptions}
            nativeSelectProps={{
              ...register("appellationCode"),
            }}
            {...getFieldError("appellationCode")}
          />
          <Input
            label={inputsLabelsByKey.datePreferences}
            hintText={
              "Exemple :  “du 1er au 10 juillet” ou “deux semaines en juin” ou “je suis flexible”"
            }
            nativeInputProps={{
              ...register("datePreferences"),
            }}
            {...getFieldError("datePreferences")}
          />

          <h2 className={fr.cx("fr-h6", "fr-mt-3w")}>
            Vos expériences et compétences
          </h2>
          <p className={fr.cx("fr-hint-text")}>
            N’hésitez pas à détailler vos compétences, cela augmentera vos
            chances de recevoir une réponse positive de l’entreprise.
          </p>

          <RadioButtons
            options={[
              {
                label: "Je n'ai jamais travaillé",
                nativeInputProps: {
                  value: 0,
                  checked: hasWorkingExperienceValue === false,
                  onChange: () => {
                    setValue("hasWorkingExperience", false);
                    setValue("experienceAdditionalInformation", undefined);
                  },
                },
              },
              {
                label:
                  "J’ai déjà une ou plusieurs expériences professionnelles, ou de bénévolat",
                nativeInputProps: {
                  value: 1,
                  checked: hasWorkingExperienceValue === true,
                  onChange: () => {
                    setValue("hasWorkingExperience", true);
                  },
                },
              },
            ]}
          />
          {hasWorkingExperienceValue && (
            <Input
              label={inputsLabelsByKey.experienceAdditionalInformation}
              hintText="Exemple : “travail en équipe”, “mise en rayon”, “babysitting”, etc."
              nativeTextAreaProps={{
                ...register("experienceAdditionalInformation"),
              }}
              {...getFieldError("experienceAdditionalInformation")}
              textArea
            />
          )}

          <Input
            label={inputsLabelsByKey.potentialBeneficiaryResumeLink}
            nativeInputProps={{
              ...register("potentialBeneficiaryResumeLink"),
            }}
            {...getFieldError("potentialBeneficiaryResumeLink")}
          />

          <ButtonsGroup
            className={fr.cx()}
            alignment="right"
            inlineLayoutWhen="always"
            buttons={[
              {
                type: "submit",
                priority: "primary",
                disabled:
                  isSubmitting ||
                  activeError.isActive ||
                  invalidEmailMessage !== null,
                nativeButtonProps: {
                  id: domElementIds.search.contactByMailButton,
                },
                children: "Envoyer",
              },
            ]}
          />
          {invalidEmailMessage !== null && (
            <Alert
              severity="error"
              title="Email invalide"
              description={`L'email de contact que vous avez utilisé dans le formulaire de contact a été invalidé par notre vérificateur d'email pour la raison suivante : ${invalidEmailMessage}`}
            />
          )}
          {activeError.isActive && (
            <Alert
              severity="error"
              title={activeError.title}
              description={activeError.description}
            />
          )}
        </>
      </form>
    </FormProvider>
  );
};

const immersionObjectiveListOfOptions: SelectProps.Option<ImmersionObjective>[] =
  conventionObjectiveOptions.map((immersionObjective) => ({
    value: immersionObjective,
    label: labelsForImmersionObjective[immersionObjective],
  }));

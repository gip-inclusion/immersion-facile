import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import CallOut from "@codegouvfr/react-dsfr/CallOut";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  AppellationDto,
  ContactEstablishmentByMailDto,
  OmitFromExistingKeys,
  contactEstablishmentByMailFormSchema,
  conventionObjectiveOptions,
  domElementIds,
} from "shared";
import { TranscientPreferencesModal } from "src/app/components/immersion-offer/TranscientPreferencesModal";
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

const motivationPlaceholder =
  "***Rédigez ici votre email de motivation en suivant nos conseils.***";
const initialMessage = `Bonjour, \n\n\
J’ai trouvé votre entreprise sur le site https://immersion-facile.beta.gouv.fr\n\
${motivationPlaceholder}
  \n\
Pourriez-vous me contacter par mail ou par téléphone pour me proposer un rendez-vous ? \n\
Je pourrais alors vous expliquer directement mon projet. \n\
  \n\
En vous remerciant,`;

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
  immersionObjective:
    "Objet de la période de mise en situation en milieu professionnel *",
  appellationCode: "Métier sur lequel porte la demande d'immersion *",
  message: "Votre message à l’entreprise *",
  potentialBeneficiaryFirstName: "Prénom *",
  potentialBeneficiaryLastName: "Nom *",
  potentialBeneficiaryEmail: "Email *",
  potentialBeneficiaryPhone: "Téléphone *",
  potentialBeneficiaryResumeLink: "Page LinkedIn ou CV en ligne (optionnel)",
};

export const ContactByEmail = ({
  appellations,
  onSubmitSuccess,
}: ContactByEmailProps) => {
  const { activeError, setActiveErrorKind } = useContactEstablishmentError();
  const route = useRoute() as Route<typeof routes.searchResult>;
  const {
    getTranscientDataForScope,
    setTranscientDataForScope,
    getPreferUseTranscientDataForScope,
  } = useTranscientDataFromStorage("contact-establishment", false);
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
      potentialBeneficiaryFirstName: route.params.contactFirstName ?? "",
      potentialBeneficiaryLastName: route.params.contactLastName ?? "",
      potentialBeneficiaryEmail: route.params.contactEmail ?? "",
      message: route.params.contactMessage ?? initialMessage,
      immersionObjective: null,
      potentialBeneficiaryResumeLink: "",
      potentialBeneficiaryPhone: route.params.contactPhone ?? "",
      locationId: route.params.location ?? "",
      ...acquisitionParams,
      ...(preferUseTranscientData && transcientDataForScope?.value
        ? { ...transcientDataForScope.value }
        : {}),
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
  } = methods;

  const getFieldError = makeFieldError(formState);

  const onFormValid = async (values: ContactEstablishmentByMailDto) => {
    setTranscientDataForScope(values, transcientExpirationTimeInMinutes);
    const errorKind =
      await outOfReduxDependencies.searchGateway.contactEstablishment({
        ...values,
        message: removeMotivationPlaceholder(values.message),
      });
    if (errorKind) return setActiveErrorKind(errorKind);
    onSubmitSuccess();
  };
  return (
    <FormProvider {...methods}>
      <TranscientPreferencesModal
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
      />
      <form onSubmit={handleSubmit(onFormValid)} id={"im-contact-form--email"}>
        <>
          <p>
            Cette entreprise a choisi d'être contactée par mail. Veuillez
            compléter ce formulaire qui sera transmis à l'entreprise.
          </p>
          <CallOut title="Besoin d'aide ?">
            <a
              href="https://immersion-facile.beta.gouv.fr/aide/article/choisir-lobjet-et-rediger-un-email-de-motivation-pour-decrocher-une-immersion-xytzii/"
              target="_blank"
              rel="noreferrer"
            >
              Nos conseils pour choisir l’objet et rédiger un bon email de
              motivation.
            </a>
          </CallOut>
          <h2 className={fr.cx("fr-h6", "fr-mt-3w")}>
            Votre email de motivation
          </h2>
          <Select
            label={inputsLabelsByKey.immersionObjective}
            options={immersionObjectiveListOfOptions}
            placeholder={"Sélectionnez un objet"}
            nativeSelectProps={{
              ...register("immersionObjective"),
            }}
            {...getFieldError("immersionObjective")}
          />
          <Select
            disabled={appellations.length === 1}
            label={inputsLabelsByKey.appellationCode}
            options={appellationListOfOptions}
            placeholder={"Sélectionnez un métier"}
            nativeSelectProps={{
              ...register("appellationCode"),
            }}
            {...getFieldError("appellationCode")}
          />
          <Input
            label={inputsLabelsByKey.message}
            textArea
            nativeTextAreaProps={{
              ...register("message"),
              rows: 6,
            }}
            {...getFieldError("message")}
          />
          <h2 className={fr.cx("fr-h6")}>Vos informations</h2>
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
          />
          <Input
            label={inputsLabelsByKey.potentialBeneficiaryPhone}
            nativeInputProps={{
              ...register("potentialBeneficiaryPhone"),
              type: "phone",
            }}
            {...getFieldError("potentialBeneficiaryPhone")}
          />
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
                disabled: isSubmitting || activeError.isActive,
                nativeButtonProps: {
                  id: domElementIds.search.contactByMailButton,
                },
                children: "Envoyer",
              },
            ]}
          />
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

const immersionObjectiveListOfOptions = conventionObjectiveOptions.map(
  (immersionObjective) => ({
    value: immersionObjective,
    label: immersionObjective,
  }),
);
const removeMotivationPlaceholder = (message: string) =>
  message.replace(`\n${motivationPlaceholder}`, "");

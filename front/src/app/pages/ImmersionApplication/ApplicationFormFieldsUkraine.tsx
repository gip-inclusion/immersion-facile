import { useField, useFormikContext } from "formik";
import React, { useEffect } from "react";
import {
  BoolRadioGroup,
  RadioGroupForField,
} from "src/app/components/RadioGroup";
import { ApplicationFormKeysInUrl } from "src/app/routing/route-params";
import { routes, useRoute } from "src/app/routing/routes";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/utils/fetchEstablishmentInfoBySiret";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import type {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { BoolCheckboxGroup } from "src/uiComponents/form/CheckboxGroup";
import { DateInput } from "src/uiComponents/form/DateInput";
import {
  SchedulePicker,
  scheduleValidator,
} from "src/uiComponents/form/SchedulePicker/SchedulePicker";
import { TextInput } from "src/uiComponents/form/TextInput";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";
import { ApplicationFormProfession } from "./ApplicationFormProfession";

const FrozenMessage = () => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">
        Cette demande d'immersion n'est plus modifiable.
      </p>
      <p>
        Cette demande d'immersion n'est plus modifiable. Veuillez la signer ou
        demander des modifications.
      </p>
    </div>
    <br />
  </>
);

type SignOnlyMessageProps = {
  isAlreadySigned: boolean;
};

const SignOnlyMessage = ({ isAlreadySigned }: SignOnlyMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">
        {isAlreadySigned
          ? "Vous avez déjà signé cette demande d'immersion."
          : "Cette demande d'immersion est prête à être signée."}
      </p>
      <p>
        {"Cette demande d'immersion n'est plus modifiable. " +
          (isAlreadySigned
            ? "Vous avez déjà signé cette demande d'immersion."
            : "Veuillez la signer ou la renvoyer pour modification.")}
      </p>
    </div>
    <br />
  </>
);

type ApplicationFieldsProps = {
  isFrozen?: boolean;
  isSignOnly?: boolean;
  isSignatureEnterprise?: boolean; //< Ignored if !isSignOnly. Determines who's signing (enterprise or beneficiary)
  signeeName?: string; //< Ignored if !isSignOnly. Name of the person signing.
  alreadySubmitted?: boolean;
  onRejectForm?: () => Promise<void>; //< called when the form is sent back for modifications in signature mode
  isUkraine?: boolean;
};

export const ApplicationFormFieldsUkraine = ({
  isFrozen,
  isSignOnly,
  isSignatureEnterprise,
  signeeName,
  alreadySubmitted,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onRejectForm = async (): Promise<void> => {},
}: ApplicationFieldsProps) => {
  const {
    errors,
    submitCount,
    setFieldValue,
    isSubmitting,
    submitForm,
    values,
  } = useFormikContext<ImmersionApplicationDto>();
  const featureFlags = useAppSelector(featureFlagsSelector);
  const isSiretFetcherDisabled = values.status !== "DRAFT";
  const { establishmentInfo, isFetchingSiret } = useSiretFetcher({
    fetchSirenApiEvenAlreadyInDb: true,
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessName", establishmentInfo, {
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessAddress", establishmentInfo, {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });

  const watchedValues = makeValuesToWatchInUrl(values);
  const {
    schedule,
    immersionAppellation,
    ...watchedValuesExceptScheduleAndAppellation
  } = watchedValues;

  const route = useRoute();
  useEffect(() => {
    if (route.name !== "immersionApplication" || !!route.params.jwt) return;
    routes.immersionApplication(watchedValues).replace();
  }, [
    ...Object.values(watchedValuesExceptScheduleAndAppellation),
    JSON.stringify(values.schedule),
    JSON.stringify(values.immersionAppellation),
  ]);

  const isSignatureMode = isSignOnly;

  return (
    <>
      {isFrozen && !isSignatureMode && <FrozenMessage />}
      {isFrozen && isSignatureMode && (
        <SignOnlyMessage isAlreadySigned={alreadySubmitted ?? false} />
      )}
      <input type="hidden" name="peExternalIdentity" />
      <FormSectionTitle>1. Coordonnées du bénéficiaire</FormSectionTitle>
      <TextInput
        label="Email *"
        name="email"
        type="email"
        placeholder="nom@exemple.com"
        description="cela nous permet de vous transmettre la validation de la convention"
        disabled={isFrozen}
      />
      <TextInput
        label="Votre prénom *"
        name="firstName"
        type="text"
        placeholder=""
        description=""
        disabled={isFrozen}
      />
      <TextInput
        label="Votre nom *"
        name="lastName"
        type="text"
        placeholder=""
        description=""
        disabled={isFrozen}
      />
      <TextInput
        label="Votre numéro de téléphone"
        name="phone"
        type="tel"
        placeholder="0606060607"
        description="pour qu’on puisse vous contacter à propos de l’immersion"
        disabled={isFrozen}
      />
      <TextInput
        label="Indiquez le prénom et le nom de la personne à prévenir en cas d'urgence"
        name="emergencyContact"
        type="text"
        placeholder=""
        description=""
        disabled={isFrozen}
      />
      <TextInput
        label="Indiquez le numéro de téléphone de la personne à prévenir en cas d'urgence"
        name="emergencyContactPhone"
        type="tel"
        placeholder="0606060607"
        description=""
        disabled={isFrozen}
      />

      <FormSectionTitle>2. Coordonnées de l'entreprise</FormSectionTitle>
      <h4>
        Les questions suivantes doivent être complétées avec la personne qui
        vous accueillera pendant votre immersion
      </h4>
      <TextInput
        label="Indiquez le SIRET de la structure d'accueil *"
        name="siret"
        placeholder="362 521 879 00034"
        description="la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
        disabled={isFrozen}
      />
      <TextInput
        label="Indiquez le nom (raison sociale) de l'établissement d'accueil *"
        name="businessName"
        type="text"
        placeholder=""
        description=""
        disabled={featureFlags.enableInseeApi}
      />
      <TextInput
        label="Indiquez le prénom, nom et fonction du tuteur *"
        name="mentor"
        type="text"
        placeholder=""
        description="Ex : Alain Prost, pilote automobile"
        disabled={isFrozen || isFetchingSiret}
      />
      <TextInput
        label="Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil *"
        name="mentorPhone"
        type="tel"
        placeholder="0606060707"
        description="pour que l'on puisse le contacter à propos de l’immersion"
        disabled={isFrozen}
      />
      <TextInput
        label="Indiquez l'e-mail du tuteur *"
        name="mentorEmail"
        type="email"
        placeholder="nom@exemple.com"
        description="pour envoyer la validation de la convention"
        disabled={isFrozen}
        className="!mb-1"
      />
      <FormSectionTitle>
        3. Conditions d’accueil de l’immersion professionnelle
      </FormSectionTitle>
      <DateInput
        label="Date de début de l'immersion *"
        name="dateStart"
        type="date"
        disabled={isFrozen}
      />
      <br />
      <DateInput
        label="Date de fin de l'immersion *"
        name="dateEnd"
        type="date"
        disabled={isFrozen}
      />
      <br />
      <SchedulePicker
        name="schedule"
        validate={scheduleValidator}
        setFieldValue={(x) => {
          setFieldValue("schedule", x);
        }}
        disabled={isFrozen}
      />
      <br />
      <TextInput
        label="Conditions de travail, propres  au métier observé pendant l’immersion. "
        name="workConditions"
        description="Ex : transport de marchandises longue distance - pas de retour au domicile pendant 2 jours"
        disabled={isFrozen}
      />
      <br />
      <AddressAutocomplete
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfo?.businessAddress
        }
        label="Adresse du lieu où se fera l'immersion * "
        setFormValue={({ label }) => setFieldValue("immersionAddress", label)}
        disabled={isFrozen || isFetchingSiret}
      />
      <br />
      <BoolRadioGroup
        name="individualProtection"
        label="Un équipement de protection individuelle est-il fourni pour l’immersion ? *"
        disabled={isFrozen}
      />
      <BoolRadioGroup
        name="sanitaryPrevention"
        label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
        disabled={isFrozen}
      />
      <TextInput
        label="Si oui, précisez-les"
        name="sanitaryPreventionDescription"
        type="text"
        placeholder=""
        description="Ex : fourniture de gel, de masques"
        disabled={isFrozen}
      />
      <RadioGroupForField
        name="immersionObjective"
        label="Objet de la période de mise en situation en milieu professionnel *"
        options={[
          { value: "Confirmer un projet professionnel" },
          { value: "Découvrir un métier ou un secteur d'activité" },
          { value: "Initier une démarche de recrutement" },
        ]}
        disabled={isFrozen}
      />
      <ApplicationFormProfession
        label="Intitulé du poste / métier observé pendant l'immersion *"
        description="Ex : employé libre service, web développeur, boulanger …"
        disabled={isFrozen}
        initialFieldValue={values.immersionAppellation}
      />
      <TextInput
        label="Activités observées / pratiquées pendant l'immersion *"
        name="immersionActivities"
        type="text"
        placeholder=""
        description="Ex : mise en rayon, accueil et aide à la clientèle"
        disabled={isFrozen}
      />
      <TextInput
        label="Compétences/aptitudes observées / évaluées pendant l'immersion"
        name="immersionSkills"
        type="text"
        placeholder=""
        description="Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe"
        disabled={isFrozen}
      />
      <p />
      <p />
      {!isSignatureMode &&
        submitCount !== 0 &&
        Object.values(errors).length > 0 && (
          <div style={{ color: "red" }}>
            Veuillez corriger les champs erronés
          </div>
        )}
      {!isFrozen && (
        <p className="font-bold">
          Une fois le formulaire envoyé, vous allez recevoir une demande de
          validation par mail et l'entreprise également.
        </p>
      )}
      <br />
      {!isFrozen && !isSignatureMode && (
        <SubmitButton isSubmitting={isSubmitting} onSubmit={submitForm} />
      )}
      {isSignatureMode && (
        <>
          {alreadySubmitted ? (
            <p>Vous avez signé la convention.</p>
          ) : (
            <>
              <BoolCheckboxGroup
                name={
                  isSignatureEnterprise
                    ? "enterpriseAccepted"
                    : "beneficiaryAccepted"
                }
                label={`Je, soussigné ${signeeName} (${
                  isSignatureEnterprise
                    ? "représentant de la structure d'accueil"
                    : "bénéficiaire de l'immersion"
                }) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *`}
                description="Avant de répondre, consultez ces dispositions ici"
                descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                disabled={false}
              />
              <p style={{ display: "flex", gap: "50px" }}>
                <SignButton isSubmitting={isSubmitting} onSubmit={submitForm} />

                <RequestModificationButton
                  onSubmit={onRejectForm}
                  isSubmitting={isSubmitting}
                />
              </p>
            </>
          )}
        </>
      )}
    </>
  );
};

type SubmitButtonProps = {
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
};

const SubmitButton = ({ onSubmit, isSubmitting }: SubmitButtonProps) => {
  const [_, __, { setValue }] = useField<ApplicationStatus>({ name: "status" });

  const makeInReviewAndSubmit = () => {
    setValue("READY_TO_SIGN");
    return onSubmit();
  };

  return (
    <button
      className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
      type="button"
      onClick={makeInReviewAndSubmit}
    >
      {isSubmitting ? "Éxecution" : "Envoyer la demande"}
    </button>
  );
};

const SignButton = ({ onSubmit, isSubmitting }: SubmitButtonProps) => (
  <button
    className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
    type="button"
    onClick={onSubmit}
  >
    {isSubmitting ? "Éxecution" : "Confirmer et signer"}
  </button>
);

export const RequestModificationButton = ({
  onSubmit,
  isSubmitting,
}: SubmitButtonProps) => (
  <button
    className="fr-btn fr-fi-edit-fill fr-btn--icon-left fr-btn--secondary"
    type="button"
    onClick={onSubmit}
  >
    {isSubmitting
      ? "Éxecution"
      : "Annuler les signatures et demander des modifications"}
  </button>
);

const makeValuesToWatchInUrl = (values: ImmersionApplicationDto) => {
  const keysToWatch: ApplicationFormKeysInUrl[] = [
    "peExternalId",
    "email",
    "firstName",
    "lastName",
    "phone",
    "dateStart",
    "dateEnd",
    "siret",
    "businessName",
    "mentor",
    "mentorEmail",
    "mentorPhone",
    "agencyId",
    "immersionAddress",
    "sanitaryPrevention",
    "individualProtection",
    "sanitaryPreventionDescription",
    "immersionObjective",
    "immersionActivities",
    "immersionSkills",
    "workConditions",
    "schedule",
    "immersionAppellation",
  ];
  const watchedValuesObject = keysToWatch.reduce(
    (acc, watchedKey) => ({ ...acc, [watchedKey]: values[watchedKey] }),
    {} as Partial<ImmersionApplicationDto>,
  );
  return watchedValuesObject;
};

import { useField, useFormikContext } from "formik";
import React from "react";
import { SuccessInfos } from "src/app/ApplicationForm/createSuccessInfos";
import { BoolRadioGroup, RadioGroup } from "src/app/RadioGroup";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/Siret/fetchEstablishmentInfoBySiret";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { AgencySelector } from "src/components/form/AgencySelector";
import { BoolCheckboxGroup } from "src/components/form/CheckboxGroup";
import { DateInput } from "src/components/form/DateInput";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import {
  SchedulePicker,
  scheduleValidator,
} from "src/components/form/SchedulePicker/SchedulePicker";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { ENV } from "src/environmentVariables";
import type {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "src/shared/ImmersionApplicationDto";

const { dev } = ENV;

const FrozenMessage = () => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">
        Cette demande d'immersion n'est plus modifiable.
      </p>
      <p>
        Cette demande d'immersion a été soumise et il n'est plus possible de la
        modifier.
      </p>
    </div>
    <br />
  </>
);

type ApplicationFieldsProps = {
  isFrozen?: boolean;
  submitError: Error | null;
  successInfos: SuccessInfos | null;
};

export const ApplicationFormFields = ({
  isFrozen,
  submitError,
  successInfos,
}: ApplicationFieldsProps) => {
  const { errors, submitCount, setFieldValue, isSubmitting, submitForm } =
    useFormikContext<ImmersionApplicationDto>();
  const { establishmentInfo, isFetchingSiret } = useSiretFetcher();
  useSiretRelatedField("businessName", establishmentInfo);
  useSiretRelatedField(
    "businessAddress",
    establishmentInfo,
    "immersionAddress",
  );

  let errorMessage = submitError?.message;
  if (
    submitError &&
    "response" in submitError &&
    "data" in submitError["response"] &&
    "errors" in submitError["response"]["data"]
  ) {
    errorMessage = submitError["response"]["data"]["errors"];
  }

  return (
    <>
      {isFrozen && <FrozenMessage />}

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

      <AgencySelector
        name="agencyId"
        label="Votre structure d'accompagnement *"
        disabled={isFrozen}
        setInitialValue={dev}
      />

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

      <h4>
        <br />
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
        disabled={isFrozen || isFetchingSiret}
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
      />

      <SchedulePicker
        name="schedule"
        validate={scheduleValidator}
        setFieldValue={(x) => {
          setFieldValue("schedule", x);
        }}
        disabled={isFrozen}
      />

      <AddressAutocomplete
        label="Adresse du lieu où se fera l'immersion * "
        setFormValue={({ label }) => setFieldValue("immersionAddress", label)}
        disabled={isFrozen || isFetchingSiret}
      />

      <BoolRadioGroup
        name="individualProtection"
        label="Un équipement de protection individuelle est-il fourni pour l’immersion ? *"
        hideNoOption={false}
        disabled={isFrozen}
      />

      <BoolRadioGroup
        name="sanitaryPrevention"
        label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
        hideNoOption={false}
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

      <RadioGroup
        name="immersionObjective"
        label="Objectif  de la période de mise en situation en milieu professionnel"
        options={[
          { value: "Confirmer un projet professionnel" },
          { value: "Découvrir un métier ou un secteur d'activité" },
          { value: "Initier une démarche de recrutement" },
        ]}
        disabled={isFrozen}
      />

      <TextInput
        label="Intitulé du poste / métier observé pendant l'immersion *"
        name="immersionProfession"
        type="text"
        placeholder=""
        description="Ex : employé libre service, web développeur, boulanger …"
        disabled={isFrozen}
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

      <BoolCheckboxGroup
        name="beneficiaryAccepted"
        label={
          "Je (bénéficiaire de l'immersion) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
        }
        description="Avant de répondre, consultez ces dispositions ici"
        descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
        disabled={isFrozen}
      />

      <BoolCheckboxGroup
        name="enterpriseAccepted"
        label={
          "Je (représentant de la structure d'accueil ) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
        }
        description="Avant de répondre, consultez ces dispositions ici"
        descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
        disabled={isFrozen}
      />

      <p />

      {submitCount !== 0 && Object.values(errors).length > 0 && (
        <div style={{ color: "red" }}>Veuillez corriger les champs erronés</div>
      )}

      {errorMessage && (
        <ErrorMessage title="Désolé: Erreur de traitement sur la plateforme, veuillez réessayer ultérieurement">
          {errorMessage}
        </ErrorMessage>
      )}

      {successInfos && (
        <SuccessMessage title="Succès de l'envoi">
          {successInfos.message}
          {successInfos.link && (
            <a href={successInfos.link}>{successInfos.link}</a>
          )}
        </SuccessMessage>
      )}

      <p />

      {!isFrozen && (
        <SubmitButton isSubmitting={isSubmitting} onSubmit={submitForm} />
      )}
    </>
  );
};

type SubmitButtonProps = {
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
};

const SaveButton = ({ onSubmit, isSubmitting }: SubmitButtonProps) => (
  <button
    className="fr-fi-save-line fr-btn--icon-left"
    type="button"
    onClick={onSubmit}
    disabled={isSubmitting}
  >
    {isSubmitting ? "Éxecution" : "Sauvegarder"}
  </button>
);

const SubmitButton = ({ onSubmit, isSubmitting }: SubmitButtonProps) => {
  const [_, __, { setValue }] = useField<ApplicationStatus>({ name: "status" });

  const makeInReviewAndSubmit = () => {
    setValue("IN_REVIEW");
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

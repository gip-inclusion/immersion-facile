import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { conventionObjectiveOptions, ConventionReadDto } from "shared";
import { ConventionFormProfession } from "src/app/components/forms/convention/ConventionFormProfession";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useSiretRelatedField } from "src/app/hooks/siret.hooks";

export const ImmersionDetailsSection = () => {
  const { setValue, getValues, register } = useFormContext<ConventionReadDto>();
  const values = getValues();
  const isSiretFetcherDisabled = values.status !== "DRAFT";

  useSiretRelatedField("businessName", {
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessAddress", {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();

  return (
    <>
      <RadioButtons
        {...formContents["individualProtection"]}
        legend={formContents["individualProtection"].label}
        hintText={formContents["individualProtection"].hintText}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) ===
              values.individualProtection,
            onChange: () => {
              setValue(
                "individualProtection",
                option.nativeInputProps.value === 1,
              );
            },
          },
        }))}
      />

      {values.internshipKind === "mini-stage-cci" && (
        <Alert
          small
          severity="info"
          className={fr.cx("fr-mb-4w")}
          description="En application des articles L 4153-8 et D 4153-15 et suivants du code
        du travail, relatif aux travaux interdits et règlementés, le jeune,
        s’il est mineur, ne peut accéder aux machines, appareils ou produits
        dont l’usage est proscrit aux mineurs. Il ne peut ni procéder à des
        manœuvres ou manipulations sur d’autres machines, produits ou
        appareils de production, ni effectuer les travaux légers autorisés aux
        mineurs par le même code."
        />
      )}

      <RadioButtons
        {...formContents["sanitaryPrevention"]}
        legend={formContents["sanitaryPrevention"].label}
        hintText={formContents["sanitaryPrevention"].hintText}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) ===
              values.sanitaryPrevention,
            onChange: () => {
              setValue(
                "sanitaryPrevention",
                option.nativeInputProps.value === 1,
                {
                  shouldValidate: true,
                },
              );
            },
          },
        }))}
      />

      <Input
        label={formContents["sanitaryPreventionDescription"].label}
        hintText={formContents["sanitaryPreventionDescription"].hintText}
        nativeInputProps={{
          ...formContents["sanitaryPreventionDescription"],
          ...register("sanitaryPreventionDescription"),
        }}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Alert
          small
          severity="info"
          className={fr.cx("fr-mb-4w")}
          description="De même, les parties signataires de la convention s’engagent à mettre
        en œuvre et respecter les consignes publiées par les services de
        l’Etat, notamment pour exemple celles concernant les mesures de
        prévention des risques de contamination en matière sanitaire."
        />
      )}

      <RadioButtons
        {...formContents["immersionObjective"]}
        legend={formContents["immersionObjective"].label}
        hintText={formContents["immersionObjective"].hintText}
        options={conventionObjectiveOptions
          .filter((option) =>
            values.internshipKind !== "mini-stage-cci"
              ? true
              : option !== "Initier une démarche de recrutement",
          )
          .map((option) => ({
            value: option,
            label: option,
            nativeInputProps: {
              onChange: () => setValue("immersionObjective", option),
              checked: option === values.immersionObjective,
              value: option,
            },
          }))}
      />

      <ConventionFormProfession
        {...formContents["immersionAppellation"]}
        initialFieldValue={values.immersionAppellation}
      />
      <Input
        label={formContents["workConditions"].label}
        hintText={formContents["workConditions"].hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents["workConditions"],
          ...register("workConditions"),
        }}
      />
      <Input
        label={formContents["businessAdvantages"].label}
        hintText={formContents["businessAdvantages"].hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents["businessAdvantages"],
          ...register("businessAdvantages"),
        }}
      />
      <Input
        label={formContents["immersionActivities"].label}
        hintText={formContents["immersionActivities"].hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents["immersionActivities"],
          ...register("immersionActivities"),
        }}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Alert
          small
          severity="info"
          className={fr.cx("fr-mb-4w")}
          description="Durant la période d’observation, le jeune participe à des activités de
        l’entreprise, en liaison avec les objectifs précisés dans l’annexe
        pédagogique, sous le contrôle des personnels responsables de leur
        encadrement en milieu professionnel. Il est soumis aux règles
        générales en vigueur dans l’entreprise ou l’organisme d’accueil,
        notamment en matière de santé, sécurité, d’horaires et de discipline.
        Le jeune est tenu au respect du secret professionnel."
        />
      )}
      <Input
        label={formContents["immersionSkills"].label}
        hintText={formContents["immersionSkills"].hintText}
        nativeInputProps={{
          ...formContents["immersionSkills"],
          ...register("immersionSkills"),
        }}
      />
    </>
  );
};

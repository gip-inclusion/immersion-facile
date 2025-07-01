import { fr } from "@codegouvfr/react-dsfr";
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { HeadingSection, SectionHighlight } from "react-design-system";
import { useFormContext } from "react-hook-form";
import {
  domElementIds,
  type FormEstablishmentDto,
  getFormattedFirstnameAndLastname,
} from "shared";
import type {
  Mode,
  OnStepChange,
  Step,
} from "src/app/components/forms/establishment/EstablishmentForm";
import { SearchResultPreview } from "src/app/components/forms/establishment/SearchResultPreview";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

export const SummarySection = ({
  mode,
  onStepChange,
  isEstablishmentAdmin,
}: {
  currentStep: Step;
  mode: Mode;
  onStepChange: OnStepChange;
  isEstablishmentAdmin: boolean;
}) => {
  const {
    getValues,
    formState: { isSubmitting },
  } = useFormContext<FormEstablishmentDto>();
  const formValues = getValues();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);

  const buttons: [ButtonProps, ...ButtonProps[]] = [
    {
      children: "Étape précédente",
      iconId: "fr-icon-arrow-left-line",
      priority: "secondary",
      type: "button",
      id: domElementIds.establishment[mode].previousButtonFromStepAndMode({
        currentStep: 3,
        mode,
      }),
      onClick: () => onStepChange(3, []),
    },
    {
      children: isEstablishmentAdmin
        ? "Enregistrer les modifications"
        : "Valider et créer l'établissement",
      iconId: "fr-icon-checkbox-circle-line",
      iconPosition: "right",
      type: "submit",
      disabled: isSubmitting,
      id: domElementIds.establishment[mode].submitFormButton,
    },
  ];

  return (
    <>
      <p>
        Voici un récapitulatif des informations saisies pour l’établissement{" "}
        {formValues.businessName} (SIRET :{" "}
        <strong id={domElementIds.establishment.create.summarySiretValue}>
          {formValues.siret}
        </strong>
        ). L’administrateur sera :{" "}
        <strong>
          {federatedIdentity?.provider === "proConnect" && (
            <span id={domElementIds.establishment.create.summaryAdminName}>
              {getFormattedFirstnameAndLastname({
                firstname: federatedIdentity.firstName,
                lastname: federatedIdentity.lastName,
              })}
              {" - "}
            </span>
          )}
          {formValues.userRights[0].email}
        </strong>
      </p>
      <HeadingSection
        title="Lieux et métiers référencés"
        description="Ces éléments apparaîtront dans la recherche d’entreprises accueillantes. Votre établissement peut donc apparaître dans différentes recherches."
      >
        <SectionHighlight>
          <p className={fr.cx("fr-text--bold", "fr-mb-0")}>
            Adresses d'accueil :
          </p>
          <ul id={domElementIds.establishment.create.summaryBusinessAddresses}>
            {formValues.businessAddresses.map((businessAddress) => (
              <li key={businessAddress.id}>{businessAddress.rawAddress}</li>
            ))}
          </ul>
          <p className={fr.cx("fr-text--bold", "fr-mb-0")}>
            Métiers proposés :
          </p>
          <ul id={domElementIds.establishment.create.summaryAppellations}>
            {formValues.appellations.map((appellation) => (
              <li key={appellation.appellationCode}>
                {appellation.appellationLabel}
              </li>
            ))}
          </ul>
        </SectionHighlight>
      </HeadingSection>
      <HeadingSection title="Paramètres de vos offres">
        <SectionHighlight>
          <p className={fr.cx("fr-text--bold", "fr-mb-0")}>Disponibilité :</p>
          <p>
            L’établissement sera visible dans l’annuaire, avec un maximum de{" "}
            {formValues.maxContactsPerMonth} candidatures par mois
          </p>

          <p className={fr.cx("fr-text--bold", "fr-mb-0")}>
            Type de candidats :
          </p>
          <p>
            <DisplaySearchableByValue searchableBy={formValues.searchableBy} />
          </p>

          <p className={fr.cx("fr-text--bold", "fr-mb-0")}>
            Moyen de contact :
          </p>
          <p>
            <DisplayContactModeValue contactMode={formValues.contactMode} />
          </p>
        </SectionHighlight>
      </HeadingSection>
      <HeadingSection
        title="Prévisualisation de votre établissement"
        description="Cette prévisualisation est donnée à titre indicatif. Elle affiche un exemple parmi les métiers et lieux que vous avez renseignés."
      >
        <SearchResultPreview establishment={formValues} />
      </HeadingSection>
      <ButtonsGroup
        buttons={buttons}
        inlineLayoutWhen="always"
        alignment="left"
      />
    </>
  );
};

const DisplaySearchableByValue = ({
  searchableBy: { jobSeekers, students },
}: {
  searchableBy: FormEstablishmentDto["searchableBy"];
}) => {
  if (!students) {
    return <div>Public non scolaire</div>;
  }
  if (!jobSeekers) {
    return <div>Public scolaire</div>;
  }
  return <div>Tout le monde (public scolaire et non scolaire)</div>;
};

const DisplayContactModeValue = ({
  contactMode,
}: {
  contactMode: FormEstablishmentDto["contactMode"];
}) => {
  const contactModeLabels: Record<FormEstablishmentDto["contactMode"], string> =
    {
      EMAIL: "Par email",
      PHONE: "Par téléphone",
      IN_PERSON: "En présentiel",
    };
  return <div>{contactModeLabels[contactMode]}</div>;
};

import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { type FormEstablishmentDto, domElementIds, getFullname } from "shared";
import type {
  Mode,
  OnStepChange,
  Step,
} from "src/app/components/forms/establishment/EstablishmentForm";
import { EstablishmentFormSection } from "src/app/components/forms/establishment/EstablishmentFormSection";
import { SearchResultPreview } from "src/app/components/forms/establishment/SearchResultPreview";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";

export const SummarySection = ({
  currentStep,
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
  const adminJwt = useAdminToken();
  const dispatch = useDispatch();
  const onClickEstablishmentDeleteButton = () => {
    const confirmed = confirm(
      `! Etes-vous sûr de vouloir supprimer cet établissement ? !
                (cette opération est irréversible 💀)`,
    );
    if (confirmed && adminJwt)
      dispatch(
        establishmentSlice.actions.deleteEstablishmentRequested({
          establishmentDelete: {
            siret: formValues.siret,
            jwt: adminJwt,
          },
          feedbackTopic: "form-establishment",
        }),
      );
    if (confirmed && !adminJwt) alert("Vous n'êtes pas admin.");
  };
  const isStepMode = currentStep !== null;

  const buttons: [ButtonProps, ...ButtonProps[]] = [
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
  if (isStepMode) {
    buttons.unshift({
      children: "Étape précédente",
      iconId: "fr-icon-arrow-left-line",
      priority: "secondary",
      type: "button",
      id: domElementIds.establishment[mode].previousButtonFromStepAndMode({
        currentStep,
        mode,
      }),
      onClick: () => onStepChange(3, []),
    });
  }

  if (isEstablishmentAdmin) {
    buttons.push({
      children: "Supprimer l'entreprise",
      iconId: "fr-icon-delete-bin-line",
      priority: "secondary",
      type: "button",
      onClick: onClickEstablishmentDeleteButton,
      disabled: isSubmitting,
      id: domElementIds.admin.manageEstablishment.submitDeleteButton,
    });
  }
  return (
    <>
      <p>
        Voici un récapitulatif des informations saisies pour l’établissement{" "}
        {formValues.businessName} (SIRET : {formValues.siret}). L’administrateur
        sera :{" "}
        <strong>
          {getFullname(
            "formValues.userRights[0].firstName",
            "formValues.userRights[0].lastName",
          )}{" "}
          - {formValues.userRights[0].email}
        </strong>
      </p>
      <EstablishmentFormSection
        title="Lieux et métiers référencés"
        description="Ces éléments apparaîtront dans la recherche d’entreprises accueillantes. Votre établissement peut donc apparaître dans différentes recherches."
      >
        <div>
          <p>Adresses d'accueil :</p>
          <ul>
            {formValues.businessAddresses.map((businessAddress) => (
              <li key={businessAddress.id}>{businessAddress.rawAddress}</li>
            ))}
          </ul>
          <p>Métiers proposés :</p>
          <ul>
            {formValues.appellations.map((appellation) => (
              <li key={appellation.appellationCode}>
                {appellation.appellationLabel}
              </li>
            ))}
          </ul>
        </div>
      </EstablishmentFormSection>
      <EstablishmentFormSection title="Paramètres de vos offres">
        <div>
          <p>Disponibilité :</p>
          <p>
            L’établissement sera visible dans l’annuaire, avec un maximum de{" "}
            {formValues.maxContactsPerMonth} candidatures par mois
          </p>
        </div>
        <div>
          <p>Type de candidats :</p>
          <DisplaySearchableByValue searchableBy={formValues.searchableBy} />
        </div>
        <div>
          <p>Moyen de contact :</p>
          <DisplayContactModeValue contactMode={formValues.contactMode} />
        </div>
      </EstablishmentFormSection>
      <EstablishmentFormSection title="Prévisualisation de votre établissement">
        <SearchResultPreview establishment={formValues} />
      </EstablishmentFormSection>
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

import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import {
  ConventionField,
  domElementIds,
  getConventionFieldName,
  InternshipKind,
  Signatory,
  SignatoryRole,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

const processedDataBySignatoryRole: Record<
  SignatoryRole,
  {
    fieldName: ConventionField;
    signatoryFunction: string;
  }
> = {
  beneficiary: {
    fieldName: getConventionFieldName("signatories.beneficiary.signedAt"),
    signatoryFunction: "bénéficiaire ",
  },
  "beneficiary-current-employer": {
    fieldName: getConventionFieldName(
      "signatories.beneficiaryCurrentEmployer.signedAt",
    ),
    signatoryFunction: "employeur actuel du bénéficiaire",
  },
  establishment: {
    fieldName: getConventionFieldName(
      "signatories.establishmentRepresentative.signedAt",
    ),
    signatoryFunction: "représentant de la structure d'accueil",
  },
  "establishment-representative": {
    fieldName: getConventionFieldName(
      "signatories.establishmentRepresentative.signedAt",
    ),
    signatoryFunction: "représentant de la structure d'accueil",
  },
  "beneficiary-representative": {
    fieldName: getConventionFieldName(
      "signatories.beneficiaryRepresentative.signedAt",
    ),
    signatoryFunction: "représentant légal du bénéficiaire",
  },
  "legal-representative": {
    fieldName: getConventionFieldName(
      "signatories.beneficiaryRepresentative.signedAt",
    ),
    signatoryFunction: "représentant légal du bénéficiaire",
  },
};

const getSignatoryProcessedData = (
  signatory: Signatory,
): {
  fieldName: ConventionField;
  signatoryFullName: string;
  signatoryFunction: string;
} => ({
  ...processedDataBySignatoryRole[signatory.role],
  signatoryFullName: `${signatory.firstName} ${signatory.lastName}`,
});

type SignatureActionsProperties = {
  signatory: Signatory;
  internshipKind: InternshipKind;
  onSubmitClick: React.MouseEventHandler<HTMLButtonElement>;
  onModificationRequired: React.MouseEventHandler<HTMLButtonElement>;
};

const {
  Component: SignModal,
  open: openSignModal,
  close: closeSignModal,
} = createModal({
  isOpenedByDefault: false,
  id: "sign",
});

export const SignatureActions = ({
  onModificationRequired,
  onSubmitClick,
  signatory,
  internshipKind,
}: SignatureActionsProperties) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const { fieldName, signatoryFullName, signatoryFunction } =
    getSignatoryProcessedData(signatory);
  const { setValue } = useFormContext();

  return (
    <>
      <ButtonsGroup
        alignment="center"
        buttonsEquisized={true}
        buttons={[
          {
            priority: "primary",
            children: "Confirmer et signer",
            onClick: openSignModal,
            type: "button",
            iconId: "fr-icon-checkbox-circle-line",
            iconPosition: "left",
            nativeButtonProps: {
              id: domElementIds.conventionToSign.openSignModalButton,
            },
          },
          {
            priority: "secondary",
            children:
              "Annuler les signatures et recevoir un lien de modification",
            disabled: isLoading || submitFeedback.kind !== "idle",
            onClick: onModificationRequired,
            type: "button",
            iconId: "fr-icon-edit-fill",
            iconPosition: "left",
          },
        ]}
      />
      <SignModal title="Accepter les dispositions réglementaires et terminer la signature">
        <>
          <strong className={fr.cx("fr-mb-8w")}>
            Je, soussigné {signatoryFullName} ({signatoryFunction}{" "}
            {internshipKind === "immersion"
              ? "de l'immersion"
              : "du mini-stage"}
            ) m'engage à avoir pris connaissance des dispositions réglementaires{" "}
            {internshipKind === "immersion" ? "de la PMSMP " : "du mini-stage "}
            énoncées ci-dessous et à les respecter
          </strong>
          <div>
            <h2 className={fr.cx("fr-h4", "fr-mt-4v")}>
              Obligations des parties :
            </h2>
            <div>
              <h3 className={fr.cx("fr-h6")}>Le bénéficiaire (candidat)</h3>
              <p>
                Le bénéficiaire s’engage à exercer les activités et tâches
                telles que définies dans la convention et à mettre en œuvre
                l’ensemble des actions lui permettant d’atteindre les objectifs
                d’insertion socioprofessionnelle attendus, et notamment à :
              </p>
              <ul>
                <li>
                  Respecter le règlement intérieur de la structure d’accueil et
                  les consignes qui lui sont données et informer le conseiller
                  référent de tout retard ou absence en fournissant les
                  documents justificatifs requis
                </li>
                <li>
                  Se conformer à l’ensemble des dispositions et mesures en
                  matière d’hygiène et de sécurité applicables aux salariés dans
                  la structure d’accueil, notamment en matière de port
                  obligatoire des EPI et propres aux activités et tâches
                  confiées
                </li>
                <li>
                  Informer le conseiller référent de tout incident et/ou
                  accident
                </li>
                <li>
                  Informer le conseiller référent et/ou la personne responsable
                  de son accueil et de son suivi des difficultés qu’il pourrait
                  rencontrer dans la mise en œuvre de cette période
                </li>
                <li>
                  Auto évaluer l’apport de la période de mise en situation en
                  milieu professionnel dans la construction de son parcours
                  d’insertion socioprofessionnelle
                </li>
              </ul>
            </div>

            <div>
              <h3 className={fr.cx("fr-h6")}>
                La structure d’accueil (entreprise)
              </h3>
              <p>
                La structure d’accueil s’engage à prendre l’ensemble des
                dispositions nécessaires en vue de permettre au bénéficiaire
                d’exercer les activités et tâches telles que définies dans la
                présente convention, à l’accompagner afin de lui permettre
                d’atteindre les objectifs d’insertion socioprofessionnelle
                attendus, et notamment à :
              </p>
              <ul>
                <li>
                  Désigner une personne chargée d’accueillir, d’aider,
                  d’informer, de guider et d’évaluer le bénéficiaire pendant la
                  période de mise en situation en milieu professionnel
                </li>
                <li>
                  Ne pas faire exécuter au bénéficiaire une tâche régulière
                  correspondant à un poste de travail permanent, à un
                  accroissement temporaire d’activité, à un emploi saisonnier ou
                  au remplacement d’un salarié en cas d’absence ou de suspension
                  de son contrat de travail
                </li>
                <li>
                  S’assurer que la mise en situation en milieu professionnel
                  respecte les règles applicables à ses salariés pour ce qui a
                  trait aux durées quotidienne et hebdomadaire de présence, à la
                  présence de nuit, au repos quotidien, hebdomadaire et aux
                  jours fériés
                </li>
                <li>
                  Etre couvert par une assurance Multirisque Professionnelle en
                  cours de validité tant à l’encontre de tiers que sur des biens
                  de la structure d’accueil.
                </li>
                <li>
                  Mettre en œuvre toutes les dispositions nécessaires en vue de
                  se conformer aux articles R.4141-3-1 et suivants du code du
                  travail en matière d’information des salariés sur les règles
                  d’hygiène et de sécurité applicables dans son établissement et
                  fournir l’ensemble des EPI nécessaires
                </li>
                <li>
                  Prévenir dès connaissance des faits, et au plus tard dans les
                  24 heures, la structure d’accompagnement de tout accident
                  survenant soit au cours ou sur le lieu de la mise en situation
                  en milieu professionnel, soit au cours du trajet
                  domicile-structure d’accueil
                </li>
                <li>
                  Donner accès aux moyens de transport et installations
                  collectifs
                </li>
                <li>
                  Libérer, à la demande de la structure d’accompagnement, le
                  bénéficiaire chaque fois que cela s’avère nécessaire
                </li>
              </ul>
            </div>

            <div>
              <h3 className={fr.cx("fr-h6")}>
                La structure d’accompagnement (conseiller)
              </h3>
              <p>
                La structure d’accompagnement s’engage, en la personne du
                conseiller référent, à assurer la mise en œuvre de la période de
                mise en situation en milieu professionnel et notamment à :
              </p>
              <ul>
                <li>
                  Assurer l’accompagnement dans la structure d’accueil du
                  bénéficiaire au travers de visites et d’entretiens sous toute
                  forme
                </li>
                <li>
                  Intervenir, à la demande de la structure d’accueil et/ou du
                  bénéficiaire pour régler toute difficulté pouvant survenir
                  pendant la période de mise en situation en milieu
                  professionnel
                </li>
                <li>
                  Informer sans délai l’organisme prescripteur ou, si le
                  bénéficiaire est salarié, l’employeur de ce dernier, de tout
                  accident survenant au cours ou sur le lieu de la mise en
                  situation en milieu professionnel ou de trajet qui lui serait
                  signalé dans le cadre de cette période
                </li>
                <li>
                  Réaliser le bilan / évaluation de la mise en situation
                  réalisée, transmis, le cas échéant, à l’organisme prescripteur
                </li>
              </ul>
            </div>

            <div>
              <h3 className={fr.cx("fr-h6")}>
                L’organisme prescripteur (prescripteur)
              </h3>
              <p>L’organisme prescripteur s’engage, à :</p>
              <ul>
                <li>
                  Analyser la pertinence de la période de mise en situation en
                  milieu professionnel proposée et d’en définir des objectifs
                  adaptés aux besoins, possibilités et capacités tant du
                  bénéficiaire que de la structure d’accueil
                </li>
                <li>
                  Procéder à la déclaration dans les 48 heures de tout accident
                  de travail ou de trajet qui lui serait signalé auprès de la
                  Caisse Primaire d’Assurance Maladie du lieu de résidence du
                  bénéficiaire dès lors qu’il couvre le risque AT/MP
                </li>
              </ul>
            </div>
          </div>
          <ButtonsGroup
            alignment="center"
            buttonsEquisized={true}
            buttons={[
              {
                priority: "primary",
                children: "Je termine la signature",
                onClick: (event) => {
                  setValue(fieldName, new Date().toISOString(), {
                    shouldValidate: true,
                  });
                  onSubmitClick(event);
                },
                type: "button",
                iconId: "fr-icon-checkbox-circle-line",
                iconPosition: "left",
                nativeButtonProps: {
                  id: domElementIds.conventionToSign.submitButton,
                },
              },
              {
                priority: "secondary",
                children: "J'abandonne",
                disabled: isLoading || submitFeedback.kind !== "idle",
                onClick: closeSignModal,
                type: "button",
                iconId: "fr-icon-edit-fill",
                iconPosition: "left",
              },
            ]}
          />
        </>
      </SignModal>
    </>
  );
};

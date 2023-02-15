import { values } from "ramda";
import React, { ReactNode } from "react";
import {
  immersionFacileContactEmail,
  Signatories,
  Signatory,
  SignatoryRole,
} from "shared";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import {
  ConventionSubmitFeedback,
  ConventionFeedbackKind,
} from "src/core-logic/domain/convention/convention.slice";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

type ConventionSubmitFeedbackNotificationProps = {
  submitFeedback: ConventionSubmitFeedback;
  signatories: Signatories;
};

export const ConventionFeedbackNotification = ({
  submitFeedback,
  signatories,
}: ConventionSubmitFeedbackNotificationProps) => {
  const messageByKind = createConventionFeedbackMessageByKind(signatories);

  return (
    <SubmitFeedbackNotification
      submitFeedback={submitFeedback}
      messageByKind={messageByKind}
    />
  );
};

const labelByRole: Record<SignatoryRole, string> = {
  beneficiary: "Le bénéficiaire",
  "beneficiary-representative": "Le représentant légal",
  "beneficiary-current-employer": "L'employeur actuel du bénéficiare",
  "legal-representative": "Le représentant légal",
  establishment: "Le responsable de l'entreprise",
  "establishment-representative": "Le responsable de l'entreprise",
};

export const createConventionFeedbackMessageByKind = (
  signatories: Signatories,
): Record<ConventionFeedbackKind, NonNullable<ReactNode>> => ({
  modificationsAskedFromSignatory:
    "Vous avez renvoyé la demande pour modification.",
  signedSuccessfully: "Votre accord a été enregistré.",
  rejected:
    "Succès. La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise.",
  modificationAskedFromCounsellorOrValidator:
    "Succès. Cette demande de modification va être communiquée par mail au bénéficiaire et à l'entreprise",
  markedAsEligible:
    "Succès. L'éligibilité de cette demande est bien enregistrée. Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la Convention.",
  markedAsValidated:
    "Succès. La validation de cette demande est bien enregistrée. La confirmation de cette validation va être communiquée par mail à chacun des signataires.",
  justSubmitted: (
    <InitialSubmitSuccessMessageBase>
      {(values(signatories) as Signatory[])
        .filter((v) => !!v)
        .map(({ role, firstName, lastName }) => (
          <li key={role}>
            {labelByRole[role]}, {firstName} {lastName} doit confirmer et signer
            cette demande (un mail avec lien de confirmation a été envoyé).
          </li>
        ))}
    </InitialSubmitSuccessMessageBase>
  ),
});

const InitialSubmitSuccessMessageBase = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { cx } = useStyles();
  return (
    <div className={fr.cx("fr-mt-2w")}>
      Merci d'avoir complété cette demande de convention.
      <ul className={fr.cx("fr-my-2w")}>{children}</ul>
      <p className={cx(fr.cx("fr-my-2w"), "fr-text")}>
        N'hésitez pas à prévenir et relancer votre tuteur. Sans votre signature
        et celle de l'entreprise, la demande ne peut pas être étudiée par votre
        conseiller.
      </p>
      <p className={cx(fr.cx("fr-my-2w"), "fr-text")}>
        Pensez à vérifier votre boîte mail et vos spams.
      </p>
      <p className={cx(fr.cx("fr-my-2w"), "fr-text")}>
        Si vous ne recevez rien, alertez nous:&nbsp;
        <a href={`mailto:${immersionFacileContactEmail}`}>
          {immersionFacileContactEmail}
        </a>
      </p>
    </div>
  );
};

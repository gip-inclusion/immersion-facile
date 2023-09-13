import React, { ReactNode } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { values } from "ramda";
import { useStyles } from "tss-react/dsfr";
import {
  filterNotFalsy,
  immersionFacileContactEmail,
  Signatories,
  Signatory,
  SignatoryRole,
} from "shared";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import {
  ConventionFeedbackKind,
  ConventionSubmitFeedback,
} from "src/core-logic/domain/convention/convention.slice";

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
  "establishment-representative": "Le responsable de l'entreprise",
};

export const createConventionFeedbackMessageByKind = (
  signatories: Signatories,
): Record<
  ConventionFeedbackKind,
  { title: string; message: NonNullable<ReactNode> }
> => ({
  modificationsAskedFromSignatory: {
    title: "Succès",
    message: "Vous avez renvoyé la demande pour modification.",
  },
  signedSuccessfully: {
    title: "Succès",
    message: "Votre accord a été enregistré.",
  },
  rejected: {
    title: "Succès",
    message:
      "La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise.",
  },
  modificationAskedFromCounsellorOrValidator: {
    title: "Succès",
    message:
      "Vous allez recevoir un lien de modification par e-mail (peut-être dans une boite générique agence).",
  },
  markedAsEligible: {
    title: "Convention marquée comme éligible !",
    message:
      "Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la Convention.",
  },
  markedAsValidated: {
    title: "Convention validée !",
    message:
      "La validation de cette demande est bien enregistrée. La confirmation de cette validation va être communiquée par mail à chacun des signataires.",
  },
  renewed: {
    title: "La convention a bien été renouvelée.",
    message:
      "La confirmation de ce renouvellement va être communiquée par mail à chacun des signataires.",
  },
  justSubmitted: {
    title: "Succès",
    message: (
      <InitialSubmitSuccessMessageBase>
        {(values(signatories) as Signatory[])
          .filter(filterNotFalsy)
          .map(({ role, firstName, lastName }) => (
            <li key={role}>
              {labelByRole[role]}, {firstName} {lastName} doit confirmer et
              signer cette demande (un mail avec lien de confirmation a été
              envoyé).
            </li>
          ))}
      </InitialSubmitSuccessMessageBase>
    ),
  },
  cancelled: {
    title: "Succès",
    message: "La convention a bien été annulée.",
  },
  deprecated: {
    title: "Succès",
    message:
      "La convention a bien été supprimée. La confirmation de cette suppression va être communiquée par mail à chacun des signataires.",
  },
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
        Si vous ne recevez rien, alertez-nous&nbsp;:&nbsp;
        <a href={`mailto:${immersionFacileContactEmail}`}>
          {immersionFacileContactEmail}
        </a>
      </p>
    </div>
  );
};

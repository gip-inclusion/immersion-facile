import { values } from "ramda";
import React from "react";
import { Signatories, Signatory, SignatoryRole } from "shared";
import {
  SubmitFeedback,
  SubmitFeedBackKind,
} from "src/app/components/SubmitFeedback";
import { ConventionSuccessFeedbackKind } from "src/core-logic/domain/convention/convention.slice";

type ConventionSubmitFeedbackNotificationProps = {
  submitFeedback: SubmitFeedBackKind<ConventionSuccessFeedbackKind>;
  signatories: Signatories;
};

export const ConventionSubmitFeedbackNotification = ({
  submitFeedback,
  signatories,
}: ConventionSubmitFeedbackNotificationProps) => {
  const messageByKind = createConventionFeedbackMessageByKind(signatories);

  return (
    <SubmitFeedback
      submitFeedback={submitFeedback}
      messageByKind={messageByKind}
    />
  );
};

const labelByRole: Record<SignatoryRole, string> = {
  beneficiary: "Le bénéficiaire",
  "beneficiary-representative": "Le représentant légal",
  "legal-representative2": "Le représentant légal",
  establishment2: "Le responsable de l'entreprise",
  "establishment-representative": "Le responsable de l'entreprise",
};

export const createConventionFeedbackMessageByKind = (
  signatories: Signatories,
): Record<ConventionSuccessFeedbackKind, React.ReactNode> => ({
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
  modificationsAsked: "Vous avez renvoyé la demande pour modification.",
  signedSuccessfully: "Votre accord a été enregistré.",
});

const InitialSubmitSuccessMessageBase = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <>
    Merci d'avoir complété cette demande de convention.
    <br />
    <br />
    <ul>{children}</ul>
    <br />
    <i>
      N'hésitez pas à prévenir et relancer votre tuteur, sans votre signature et
      celle de l'entreprise, la demande ne peut pas être étudiée par votre
      conseiller.
    </i>
    <br />
    <br />
    Pensez à vérifier votre boîte mail et vos spams.
    <br /> Si vous ne recevez rien, alertez nous:{" "}
    <a href="mailto:contact@immersion-facile.beta.gouv.fr">
      contact@immersion-facile.beta.gouv.fr
    </a>
  </>
);

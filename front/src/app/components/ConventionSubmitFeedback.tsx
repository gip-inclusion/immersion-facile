import { values } from "ramda";
import {
  Signatories,
  Signatory,
  SignatoryRole,
} from "shared/src/convention/convention.dto";
import React from "react";
import {
  SubmitFeedback,
  SubmitFeedBackKind,
} from "src/app/components/SubmitFeedback";

export type SuccessFeedbackKindConvention =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAsked";

type ConventionSubmitFeedbackProps = {
  submitFeedback: SubmitFeedBackKind<SuccessFeedbackKindConvention>;
  signatories: Signatories;
};

export const ConventionSubmitFeedback = ({
  submitFeedback,
  signatories,
}: ConventionSubmitFeedbackProps) => {
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
  "legal-representative": "Le représentant légal",
  establishment: "Le mentor",
};

export const createConventionFeedbackMessageByKind = (
  signatories: Signatories,
): Record<SuccessFeedbackKindConvention, React.ReactNode> => ({
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

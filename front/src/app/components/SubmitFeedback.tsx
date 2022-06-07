import React from "react";
import { Notification } from "react-design-system/immersionFacile";

export type SuccessFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAsked"
  | "agencyAdded";

type SubmitFeedbackProps = {
  submitFeedback: SuccessFeedbackKind | Error | null;
};

export const SubmitFeedback = ({ submitFeedback }: SubmitFeedbackProps) => {
  if (submitFeedback === null) return null;

  return (
    <>
      {submitFeedback instanceof Error ? (
        <Notification
          type="error"
          title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement"
        >
          {getErrorMessage(submitFeedback)}
        </Notification>
      ) : (
        <Notification type="success" title="Succès de l'envoi">
          {messageByKind[submitFeedback]}
        </Notification>
      )}
    </>
  );
};

const InitialSubmitSuccessMessage = () => (
  <>
    Merci d'avoir complété cette demande de convention.
    <br />
    <br />
    <ul>
      <li>
        Vous devez maintenant confirmer et signer cette demande (un mail avec
        lien de confirmation vous a été envoyé).
      </li>
      <li>
        Votre tuteur doit confirmer et signer cette demande (un mail avec lien
        de confirmation lui a été envoyé).
      </li>
    </ul>
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

const messageByKind: Record<SuccessFeedbackKind, React.ReactNode> = {
  justSubmitted: <InitialSubmitSuccessMessage />,
  modificationsAsked: "Vous avez renvoyé la demande pour modification.",
  signedSuccessfully: "Votre accord a été enregistré.",
  agencyAdded:
    "L'agence a été ajoutée avec succès. Vous devez attendre qu'elle soit validée " +
    "avant qu'elle ne soit effectivement disponible pour conventionner des immersions",
};

const getErrorMessage = (submitError: Error) =>
  (submitError as any)?.response?.data?.errors ?? submitError?.message;

import React from "react";

export interface SuccessInfos {
  message: string | React.ReactFragment;
  link: string | undefined;
}

export const createSuccessInfos = (link: string | undefined): SuccessInfos => ({
  message: link
    ? "Vous pouvez accéder à votre demande avec le lien suivant :"
    : formattedmmersionDemandSuccess(),
  link,
});

const formattedmmersionDemandSuccess = (): JSX.Element => (
  <>
    Merci d'avoir complété cette demande de convention.
    <br />
    <br />
    <ul>
      <li>
        Vous devez maintenant confirmer et signer cette demande (un mail avec
        lien de confirmation vous à été envoyé).
      </li>
      <li>
        Votre tuteur doit confirmer et signer cette demande (un mail avec lien
        de confirmation lui à été envoyé).
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

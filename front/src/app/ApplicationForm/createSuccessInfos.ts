export interface SuccessInfos {
  message: string;
  link: string | undefined;
}

export const createSuccessInfos = (link: string | undefined): SuccessInfos => ({
  message: link
    ? "Vous pouvez acceder à votre demande avec le lien suivant :"
    : `Merci d'avoir complété ce formulaire. Il va être transmis à votre conseiller
      référent. Il vous informera par mail de la validation ou non de l'immersion.
      Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      Attention, ne démarrez jamais une immersion tant que vous n'avez pas reçu de
      validation ! Bonne journée !`,
  link,
});

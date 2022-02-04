export interface SuccessInfos {
  message: string;
  link: string | undefined;
}

export const createSuccessInfos = (link: string | undefined): SuccessInfos => ({
  message: link
    ? "Vous pouvez accéder à votre demande avec le lien suivant :"
    : defaultSuccessMessage(),
  link,
});

const defaultSuccessMessage = () =>
  `Merci d'avoir complété cette demande d'immersion. Elle n'est plus modifiable. 
Vous allez pouvoir désormais confirmer votre demande. Un mail vient de vous être envoyé.`;

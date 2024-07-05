import { Email } from "shared";

export type MarketingContact = {
  firstName: string; //PRENOM
  lastName: string; //NOM
  email: Email; //EMAIL (dans le cas d'un establishment lead --> mail du rep légal de l'entreprise / cas entreprise référencée --> mail de contact de l'entreprise)
  createdAt: Date;
};

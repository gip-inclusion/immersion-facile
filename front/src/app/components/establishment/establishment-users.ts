import { FrClassName } from "@codegouvfr/react-dsfr";
import { EstablishmentRole } from "shared";

type EstablishmentDisplayedRoleAndClass = {
  label: string;
  className: FrClassName;
  description: string;
};

export const establishmentRoleToDisplay: Record<
  EstablishmentRole,
  EstablishmentDisplayedRoleAndClass
> = {
  "establishment-admin": {
    label: "Administrateur",
    className: "fr-badge--green-emeraude",
    description:
      "Peut modifier les informations de l'entreprise, ajouter et supprimer des utilisateurs, modifier leur rôles, consulter les conventions et les mises en relation. Peut répondre aux mises en relation de l'entreprise.",
  },
  "establishment-contact": {
    label: "Contact d'entreprise",
    className: "fr-badge--purple-glycine",
    description:
      "Peut consulter des conventions et des mises en relation de l'entreprise. Peut répondre aux mises en relation de l'entreprise.",
  },
};

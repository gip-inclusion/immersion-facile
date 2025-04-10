import type { FrClassName } from "@codegouvfr/react-dsfr";
import type { AgencyRole, EstablishmentRole } from "shared";

type UserRoleDisplay<T extends AgencyRole | EstablishmentRole> = Record<
  T,
  UserDisplayedRoleAndClass
>;

export const agencyRolesToDisplay: UserRoleDisplay<AgencyRole> = {
  "agency-admin": {
    label: "Administrateur",
    className: "fr-badge--green-emeraude",
    description:
      "Peut modifier les informations de l'organisme, ajouter et supprimer des utilisateurs, modifier leur rôles, consulter les conventions.",
  },
  "to-review": {
    label: "À valider",
    className: "fr-badge--yellow-tournesol",
    description: "",
  },
  validator: {
    label: "Validateur",
    className: "fr-badge--purple-glycine",
    description:
      "Peut valider des conventions de l'agence et modifier leur statut.",
  },
  counsellor: {
    label: "Pré-validateur",
    className: "fr-badge--brown-caramel",
    description:
      "Peut pré-valider les conventions de l'agence et modifier leur statut.",
  },
  "agency-viewer": {
    label: "Lecteur",
    className: "fr-badge--blue-cumulus",
    description: "Peut consulter les conventions de l'agence.",
  },
};

export const establishmentRolesToDisplay: UserRoleDisplay<EstablishmentRole> = {
  "establishment-admin": {
    label: "Administrateur",
    className: "fr-badge--green-emeraude",
    description:
      "L’administrateur accède aux conventions, aux candidatures (lecture et réponse) et peut gérer la fiche entreprise et les utilisateurs de l’établissement.",
  },
  "establishment-contact": {
    label: "Contact",
    className: "fr-badge--blue-cumulus",
    description:
      "Le contact accède aux conventions et aux candidatures (lecture et réponse) de l’établissement.",
  },
};

type UserDisplayedRoleAndClass = {
  label: string;
  className: FrClassName;
  description: string;
};

export const userRolesToDisplay: UserRoleDisplay<
  AgencyRole | EstablishmentRole
> = {
  ...agencyRolesToDisplay,
  ...establishmentRolesToDisplay,
};

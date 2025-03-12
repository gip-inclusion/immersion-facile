import type { ReactNode } from "react";
import { immersionFacileDelegationEmail } from "shared";
import type { AgencyAdminSuccessFeedbackKind } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import type { AgenciesFeedbackKind } from "src/core-logic/domain/agencies/agencies.slice";

export const agencyAdminSubmitMessageByKind: Record<
  AgencyAdminSuccessFeedbackKind,
  { title: string; message: NonNullable<ReactNode> }
> = {
  agencyUpdated: {
    title: "Succès",
    message: "Agence éditée avec succès",
  },
};

export const agenciesSubmitMessageByKind: Record<
  AgenciesFeedbackKind,
  { title: string; message: NonNullable<ReactNode> }
> = {
  agencyAdded: {
    title: "Succès",
    message:
      "L'agence a été ajoutée avec succès. Vous devez attendre qu'elle soit validée avant qu'elle ne soit effectivement disponible pour conventionner des immersions",
  },
  agencyInfoFetched: {
    title: "Succès",
    message:
      "La récupération des informations d'agence s'est déroulée avec succès",
  },
  agencyOptionsFetched: {
    title: "Succès",
    message:
      "La récupération de la liste des agences s'est déroulée avec succès",
  },
  agencyOfTypeOtherAdded: {
    title: "N'oubliez pas de finaliser votre référencement !",
    message: (
      <>
        Envoyez-nous votre convention de délégation au format pdf par email à
        l'adresse:{" "}
        <a href={`mailto:${immersionFacileDelegationEmail}`}>
          {immersionFacileDelegationEmail}
        </a>
      </>
    ),
  },
};

import { ReactNode } from "react";
import { AgencySuccessFeedbackKind } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";

export const agencySubmitMessageByKind: Record<
  AgencySuccessFeedbackKind,
  NonNullable<ReactNode>
> = {
  agencyAdded:
    "L'agence a été ajoutée avec succès. Vous devez attendre qu'elle soit validée avant qu'elle ne soit effectivement disponible pour conventionner des immersions",
  agencyUpdated: "Agence éditée avec succès",
  agencyRegisterToUserSuccess:
    "L'agence a été assignée à l'utilisateur avec succès",
  usersToReviewFetchSuccess:
    "La récupération des utilisateurs à revoir a réussi",
};

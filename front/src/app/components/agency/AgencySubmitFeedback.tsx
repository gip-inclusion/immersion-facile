import { ReactNode } from "react";
import { immersionFacileDelegationEmail } from "shared";
import { AgencyAdminSuccessFeedbackKind } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";

export const agencySubmitMessageByKind: Record<
  AgencyAdminSuccessFeedbackKind,
  { title: string; message: NonNullable<ReactNode> }
> = {
  agencyAdded: {
    title: "Succès",
    message:
      "L'agence a été ajoutée avec succès. Vous devez attendre qu'elle soit validée avant qu'elle ne soit effectivement disponible pour conventionner des immersions",
  },
  agencyUpdated: {
    title: "Succès",
    message: "Agence éditée avec succès",
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

import React from "react";

export type SuccessFeedbackKindAgency = "agencyAdded";

export const agencySubmitMessageByKind: Record<
  SuccessFeedbackKindAgency,
  React.ReactNode
> = {
  agencyAdded:
    "L'agence a été ajoutée avec succès. Vous devez attendre qu'elle soit validée avant qu'elle ne soit effectivement disponible pour conventionner des immersions",
};

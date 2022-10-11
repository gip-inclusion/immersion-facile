import React from "react";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AgencySubmitFeedback = SubmitFeedBack<SuccessFeedbackKindAgency>;

export type SuccessFeedbackKindAgency = "agencyAdded";

export const agencySubmitMessageByKind: Record<
  SuccessFeedbackKindAgency,
  React.ReactNode
> = {
  agencyAdded:
    "L'agence a été ajoutée avec succès. Vous devez attendre qu'elle soit validée avant qu'elle ne soit effectivement disponible pour conventionner des immersions",
};

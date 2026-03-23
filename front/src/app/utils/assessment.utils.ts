import type { AssessmentCompletionStatusFilter } from "shared";

export const makeAssessmentTextsByStatus = ({
  isPlural,
}: {
  isPlural: boolean;
}): Record<
  AssessmentCompletionStatusFilter,
  { shortLabel: string; longLabel: string; description?: string }
> => ({
  finalized: {
    shortLabel: isPlural ? "Bilans signés" : "Bilan signé",
    longLabel: isPlural
      ? "Bilans complétés et signés"
      : "Bilan complété et signé",
    description:
      "La signature n'est requise que lorsque la personne en immersion s'est présentée.",
  },
  "to-sign": {
    shortLabel: isPlural ? "Bilans à signer" : "Bilan à signer",
    longLabel: isPlural
      ? "Bilans à signer par la personne en immersion"
      : "Bilan à signer par la personne en immersion",
    description:
      "Le bilan n'a pas encore été signé par la personne en immersion.",
  },
  "to-complete": {
    shortLabel: isPlural ? "Bilans à compléter" : "Bilan à compléter",
    longLabel: isPlural
      ? "Bilans à compléter par le tuteur"
      : "Bilan à compléter par le tuteur",
    description: "Le bilan n'a pas encore été complété par l'entreprise.",
  },
});

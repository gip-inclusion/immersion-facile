import { useField } from "formik";
import { getConventionFieldName, InternshipKind } from "shared";
import {
  immersionTexts,
  ConventionTexts,
} from "src/app/pages/Convention/texts/immersionTexts";
import { miniStageTexts } from "src/app/pages/Convention/texts/miniStageTexts";

export const useConventionTexts = (internshipKind: InternshipKind) =>
  textsByInternshipKind[internshipKind];

export const useConventionTextsFromFormikContext = () => {
  const [{ value: internshipKind }] = useField<InternshipKind>(
    getConventionFieldName("internshipKind"),
  );
  return useConventionTexts(internshipKind);
};

const textsByInternshipKind: Record<InternshipKind, ConventionTexts> = {
  immersion: immersionTexts,
  "mini-stage-cci": miniStageTexts,
};

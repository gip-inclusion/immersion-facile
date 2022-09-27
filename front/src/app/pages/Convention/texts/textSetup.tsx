import { useField } from "formik";
import { getConventionFieldName } from "shared/src/convention/convention";
import { InternshipKind } from "shared/src/convention/convention.dto";
import {
  immersionTexts,
  Texts,
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

const textsByInternshipKind: Record<InternshipKind, Texts> = {
  immersion: immersionTexts,
  "mini-stage-cci": miniStageTexts,
};

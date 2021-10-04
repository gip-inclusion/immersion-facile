import * as Yup from "../../node_modules/yup";

// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
const romeCodeMetierRegex = /[A-N]\d{4}/;

export const romeCodeMetierSchema = Yup.string().matches(
  romeCodeMetierRegex,
  "Code ROME incorrect",
);

export type RomeCodeMetierDto = Yup.InferType<typeof romeSearchResponseSchema>;

const romeCodeAppellationRegex = /\d{5}/;

const romeCodeAppellationSchema = Yup.string().matches(
  romeCodeAppellationRegex,
  "Code ROME incorrect",
);

export const professionSchema = Yup.object({
  romeCodeMetier: romeCodeMetierSchema.test(
    "romeCodeMetier-exactlyOneCode",
    "Obligatoire: 'romeCodeMetier' ou 'romeCodeAppellation'",
    (value, context) => !!value !== !!context.parent.romeCodeAppellation,
  ),
  romeCodeAppellation: romeCodeAppellationSchema,
  description: Yup.string().required("Obligatoire"),
});

export type ProfessionDto = Yup.InferType<typeof professionSchema>;

const matchRangeSchema = Yup.object({
  startIndexInclusive: Yup.number().min(0).integer().required("Obligatoire"),
  endIndexExclusive: Yup.number().min(0).integer().required("Obligatoire"),
});

export type MatchRangeDto = Yup.InferType<typeof matchRangeSchema>;

export const romeSearchMatchSchema = Yup.object({
  profession: professionSchema.required("Obligatoire"),
  matchRanges: Yup.array().of(matchRangeSchema).required("Obligatoire"),
});

export type RomeSearchMatchDto = Yup.InferType<typeof romeSearchMatchSchema>;

export const romeSearchRequestSchema = Yup.string().required("Obligatoire");

export type RomeSearchRequestDto = Yup.InferType<
  typeof romeSearchRequestSchema
>;

export const romeSearchResponseSchema = Yup.array(
  romeSearchMatchSchema,
).required("Obligatoire");

export type RomeSearchResponseDto = Yup.InferType<
  typeof romeSearchResponseSchema
>;

import * as Yup from "../../node_modules/yup";

// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
const romeCodeMetierRegex = /[A-N]\d{4}/;

export const romeCodeMetierDtoSchema = Yup.string()
  .matches(romeCodeMetierRegex, "Code ROME incorrect")
  .required("Obligatoire");

export const professionDtoSchema = Yup.object({
  romeCodeMetier: romeCodeMetierDtoSchema.required("Obligatoire"),
});

const matchRangeSchema = Yup.object({
  startIndexInclusive: Yup.number().positive().required("Obligatoire"),
  endIndexExclusive: Yup.number().positive().required("Obligatoire"),
});

export const romeSearchMatchSchema = Yup.object({
  romeCodeMetier: romeCodeMetierDtoSchema.required("Obligatoire"),
  description: Yup.string().required("Obligatoire"),
  matchRanges: Yup.array().of(matchRangeSchema).required("Obligatoire"),
});

export type RomeSearchMatchDto = Yup.InferType<typeof romeSearchMatchSchema>;

export type ProfessionDto = Yup.InferType<typeof professionDtoSchema>;

export const romeSearchRequestDtoSchema = Yup.string().required("Obligatoire");

export type RomeSearchRequestDto = Yup.InferType<
  typeof romeSearchRequestDtoSchema
>;

export const romeSearchResponseDtoSchema = Yup.array(
  romeSearchMatchSchema,
).required("Obligatoire");

export type RomeSearchResponseDto = Yup.InferType<
  typeof romeSearchResponseDtoSchema
>;

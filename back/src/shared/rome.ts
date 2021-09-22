import * as Yup from "yup";

// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
const romeCodeMetierRegex = /[A-N]\d{4}/;

export const romeCodeMetierDtoSchema = Yup.string()
  .matches(romeCodeMetierRegex, "Code ROME incorrect")
  .required("Obligatoire");

export const professionDtoSchema = Yup.object({
  romeCodeMetier: romeCodeMetierDtoSchema.required(),
});

export const romeProfessionDtoSchema = Yup.object({
  romeCodeMetier: romeCodeMetierDtoSchema.required(),
  description: Yup.string().required(),
});

export const romeSearchRequestDtoSchema = Yup.string().required();

export type RomeSearchRequestDto = Yup.InferType<
  typeof romeSearchRequestDtoSchema
>;

export const romeSearchResponseDtoSchema = Yup.array(
  romeProfessionDtoSchema
).required();

export type RomeSearchResponseDto = Yup.InferType<
  typeof romeSearchResponseDtoSchema
>;

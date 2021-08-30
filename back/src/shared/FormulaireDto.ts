import * as Yup from "../../node_modules/yup";

// TODO: find the standard for gouv.fr phone verification
const phoneRegExp = /\+?[0-9]*/;

// Matches valid dates of the format 'yyyy-mm-dd'.
const dateRegExp = /\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/;

export enum FormulaireStatus {
  UNKNOWN = "UNKNOWN",
  DRAFT = "DRAFT",
  FINALIZED = "FINALIZED",
}
export class FormulaireStatusUtil {
  static fromString(s: string): FormulaireStatus {
    if (
      Object.values(FormulaireStatus).some((status: string) => status === s)
    ) {
      return <FormulaireStatus>s;
    }
    return FormulaireStatus.UNKNOWN;
  }
}

export const formulaireDtoSchema = Yup.object({
  status: Yup.mixed<FormulaireStatus>()
    .oneOf(Object.values(FormulaireStatus))
    .required("Obligatoire"),
  email: Yup.string()
    .required("Obligatoire")
    .email("Veuillez saisir une adresse e-mail valide"),
  firstName: Yup.string()
    .required("Obligatoire"),
  lastName: Yup.string()
    .required("Obligatoire"),
  phone: Yup.string()
    .matches(phoneRegExp, 'Numero de téléphone incorrect')
    .nullable(true),
  dateSubmission: Yup.string()
    .matches(dateRegExp, "La date de saisie est invalide.")
    .required("Obligatoire"),
  dateStart: Yup.string()
    .matches(dateRegExp, "La date de démarrage est invalide.")
    .test(
      "dateStart-min",
      "La date de démarrage doit étre au moins 2 jours après la saisie.",
      (value, context) => {
        if (!value || !context.parent.dateSubmission) {
          return false;
        }
        const startDate = new Date(value);
        const submissionDate = new Date(context.parent.dateSubmission);

        let minStartDate = new Date(submissionDate);
        minStartDate.setDate(minStartDate.getDate() + 2);
        return startDate >= minStartDate;
      }
    )
    .required("Obligatoire"),
  dateEnd: Yup.string()
    .matches(dateRegExp, "La date de fin invalide.")
    .test(
      "dateEnd-min",
      "La date de fin doit être après la date de début.",
      (value, context) => {
        if (!value || !context.parent.dateStart) {
          return false;
        }
        const startDate = new Date(context.parent.dateStart);
        const endDate = new Date(value);

        return endDate > startDate;
      }
    )
    .test(
      "dateEnd-max",
      "La durée maximale d'immersion est de 28 jours.",
      (value, context) => {
        if (!value || !context.parent.dateStart) {
          return false;
        }
        const startDate = new Date(context.parent.dateStart);
        const endDate = new Date(value);

        let maxEndDate = new Date(startDate);
        maxEndDate.setDate(maxEndDate.getDate() + 28);
        return endDate <= maxEndDate;
      }
    )
    .required("Obligatoire"),
    siret: Yup.string()
    .required("Obligatoire")
    .length(14, "SIRET doit étre composé de 14 chiffres"),
  businessName: Yup.string()
    .required("Obligatoire"),

  mentor: Yup.string()
    .required("Obligatoire"),
  mentorPhone: Yup.string()
    .required("Obligatoire")
    .matches(phoneRegExp, 'Numero de téléphone de tuteur incorrect'),
  mentorEmail: Yup.string()
    .required("Obligatoire")
    .email("Veuillez saisir un adresse mail correct"),

  workdays: Yup.array(Yup.string().required())
    .required("Obligatoire"),
  workHours: Yup.string()
    .required("Obligatoire"),

  individualProtection: Yup.boolean()
    .required("Obligatoire"),
  sanitaryPrevention: Yup.boolean()
    .required("Obligatoire"),
  sanitaryPreventionDescription: Yup.string()
    .nullable(true),

  immersionAddress: Yup.string()
    .nullable(true),
  immersionObjective: Yup.string()
    .nullable(true),
  immersionProfession: Yup.string()
    .required("Obligatoire"),
  immersionActivities: Yup.string()
    .required("Obligatoire"),
  immersionSkills: Yup.string()
    .nullable(true),
  beneficiaryAccepted: Yup.boolean().equals([true], "L'engagement est obligatoire"),
  enterpriseAccepted: Yup.boolean().equals([true], "L'engagement est obligatoire"),
}).required();

export const formulaireDtoArraySchema = Yup.array().of(formulaireDtoSchema);

export type FormulaireDto = Yup.InferType<typeof formulaireDtoSchema>;

export const addFormulaireResponseDtoSchema = Yup.object({
  id: Yup.string().required(),
}).required();

export type AddFormulaireResponseDto = Yup.InferType<
  typeof addFormulaireResponseDtoSchema
>;

export const getFormulaireRequestDtoSchema = Yup.object({
  id: Yup.string().required(),
}).required();

export type GetFormulaireRequestDto = Yup.InferType<
  typeof getFormulaireRequestDtoSchema
>;

export const updateFormulaireRequestDtoSchema = Yup.object({
  id: Yup.string().required(),
  formulaire: formulaireDtoSchema.required(),
}).required();

export type UpdateFormulaireRequestDto = Yup.InferType<
  typeof updateFormulaireRequestDtoSchema
>;

export const updateFormulaireResponseDtoSchema = Yup.object({
  id: Yup.string().required(),
}).required();

export type UpdateFormulaireResponseDto = Yup.InferType<
  typeof updateFormulaireResponseDtoSchema
>;

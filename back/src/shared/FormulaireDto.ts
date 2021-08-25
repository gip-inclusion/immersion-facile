import * as Yup from "../../node_modules/yup";

// TODO: find the standard for gouv.fr phone verification
const phoneRegExp = /\+?[0-9]*/;

export const formulaireDtoSchema = Yup.object({
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
  dateStart: Yup.date()
    .required("Obligatoire"),
  dateEnd: Yup.date()
    .required("Obligatoire")
    .min(Yup.ref('dateStart'), "Date de fin doit être après la date de début")
    .test(
      "moins-28j",
      "La durée maximale d\'immersion est de 28 jours",
      (value, context) => {
        const startDate = context.parent.dateStart;
        if (!value || !startDate || !(startDate instanceof Date)) {
          return false;
        }
        let maxEndDate = new Date(startDate)
        maxEndDate.setDate(maxEndDate.getDate() + 28)
        return value <= maxEndDate;
      }
    ),



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

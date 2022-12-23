import { path } from "shared";
import { FormAgencyFieldsLabels } from "../contents/forms/agency/formAgency";
import { FormEstablishmentFieldsLabels } from "../contents/forms/establishment/formEstablishment";
import { FormField } from "../contents/forms/types";

type FormFieldsLabels = Partial<
  FormAgencyFieldsLabels & FormEstablishmentFieldsLabels
>;

const formatFieldLabel = (field: FormField<unknown>) =>
  `${field.label}${field.required ? " *" : ""}`;

const getFormErrorLabels = (formFieldsLabels: FormFieldsLabels) =>
  Object.keys(formFieldsLabels).reduce((sum, key) => {
    let value;
    const field = path(key as keyof FormFieldsLabels, formFieldsLabels);
    if (field && "label" in field) {
      value = field.label;
    }
    return {
      ...sum,
      [key]: value,
    };
  }, {});

// const getFormField = (
//   key: keyof FormFieldsLabels,
//   formFieldsLabels: FormFieldsLabels,
// ) => {
//   const field = path(key, formFieldsLabels);
//   if (field && "label" in field) {
//     field.label = formatFieldLabel(key, formFieldsLabels);
//   }
//   return (
//     field || {
//       label: "field not set",
//     }
//   );
// };

// const getFormFields = (
//   formFieldsLabels: FormFieldsLabels,
// ): Partial<Record<keyof FormFieldsLabels, FormFieldsLabels>> =>
//   Object.keys(formFieldsLabels).reduce(
//     (sum, key) => ({
//       ...sum,
//       [key]: getFormField(key as keyof FormFieldsLabels, formFieldsLabels),
//     }),
//     {},
//   );

export const useFormContents = (formFieldsLabels: FormFieldsLabels) => ({
  formErrorLabels: getFormErrorLabels(formFieldsLabels),
  formatFieldLabel,
});

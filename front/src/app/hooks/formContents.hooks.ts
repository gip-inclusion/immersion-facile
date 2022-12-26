import { FormFieldAttributes } from "../contents/forms/types";

export type FormFieldsObject<T> = Record<keyof T, FormFieldAttributes>;

type FormFieldsKeys<T> = keyof FormFieldsObject<T>;

const defaultField: FormFieldAttributes = {
  label: "field label not set",
  id: "field-id-not-set",
  name: "field-name-not-set",
};

const formatFieldLabel = (field: FormFieldAttributes) =>
  `${field.label}${field.required ? " *" : ""}`;

const getFormErrors =
  <T>(formFieldsLabels: FormFieldsObject<T>) =>
  () =>
    Object.fromEntries(
      Object.keys(formFieldsLabels).map((key) => [
        key,
        formFieldsLabels[key as FormFieldsKeys<T>]?.label,
      ]),
    );
const getFormFieldAttributes = <T>(
  key: FormFieldsKeys<T>,
  formFieldsLabels: FormFieldsObject<T>,
) => {
  const field = formFieldsLabels[key];
  const formattedField = {
    ...defaultField,
    ...(field ? field : {}),
    label: field ? formatFieldLabel(field) : defaultField.label,
    name: key,
  };
  return formattedField;
};

const getFormFields =
  <T>(formFieldsLabels: FormFieldsObject<T>) =>
  () =>
    Object.keys(formFieldsLabels).reduce(
      (sum, key) => ({
        ...sum,
        [key]: getFormFieldAttributes(
          key as FormFieldsKeys<T>,
          formFieldsLabels,
        ),
      }),
      formFieldsLabels,
    );

export const useFormContents = <T>(formFieldsLabels: FormFieldsObject<T>) => ({
  getFormErrors: getFormErrors(formFieldsLabels),
  getFormFields: getFormFields(formFieldsLabels),
});

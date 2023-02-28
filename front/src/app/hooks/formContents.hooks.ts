import {
  FormFieldAttributes,
  FormFieldAttributesForContent,
} from "../contents/forms/types";
import {
  type FormState,
  type FieldValues,
  FieldErrorsImpl,
} from "react-hook-form";
import { keys } from "ramda";

export type FormFieldsObject<T> = Record<keyof T, FormFieldAttributes>;
export type FormFieldsObjectForContent<T> = Record<
  keyof T,
  FormFieldAttributesForContent
>;

export const useFormContents = <T>(
  formFieldsLabels: FormFieldsObjectForContent<T>,
) => ({
  getFormFields: getFormFields(formFieldsLabels),
  getFormErrors: getFormErrors(formFieldsLabels),
});

type FormFieldsKeys<T> = keyof FormFieldsObject<T>;

const defaultField: FormFieldAttributes = {
  label: "field label not set",
  id: "field-id-not-set",
  name: "field-name-not-set",
};

const formatFieldLabel = (field: FormFieldAttributesForContent) =>
  `${field.label}${field.required ? " *" : ""}`;

const getFormErrors =
  <T>(formFieldsLabels: FormFieldsObjectForContent<T>) =>
  () =>
    Object.fromEntries(
      Object.keys(formFieldsLabels).map((key) => [
        key,
        formFieldsLabels[key as FormFieldsKeys<T>]?.label,
      ]),
    );

const getFormFields =
  <T>(formFieldsLabels: FormFieldsObjectForContent<T>) =>
  (): FormFieldsObject<T> =>
    Object.keys(formFieldsLabels).reduce(
      (sum, key) => ({
        ...sum,
        [key]: getFormFieldAttributes(
          key as FormFieldsKeys<T>,
          formFieldsLabels,
        ),
      }),
      formFieldsLabels as FormFieldsObject<T>,
    );

const getFormFieldAttributes = <T>(
  key: FormFieldsKeys<T>,
  formFieldsLabels: FormFieldsObjectForContent<T>,
): FormFieldAttributes => {
  const field = formFieldsLabels[key];
  return {
    ...defaultField,
    ...(field ? field : {}),
    label: field ? formatFieldLabel(field) : defaultField.label,
    name: String(key),
  };
};

export const makeFieldError =
  <Context extends FieldValues>(context: FormState<Context>) =>
  (
    name: keyof Context,
  ): {
    state: "error" | "default";
    stateRelatedMessage: string | undefined;
  } | null =>
    name in context.errors
      ? {
          state: "error" as const,
          stateRelatedMessage: context.errors[name]?.message as string,
        }
      : null;

export const formErrorsToFlatErrors = (
  formErrors: Partial<FieldErrorsImpl<any>>,
) =>
  keys(formErrors).reduce(
    (acc, errorKey) => ({
      ...acc,
      [errorKey]: formErrors[errorKey as string]?.message,
    }),
    {},
  );

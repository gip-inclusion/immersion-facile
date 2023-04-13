import { type FieldValues, type FormState, get } from "react-hook-form";

import { DotNestedKeys } from "shared";

import {
  FormFieldAttributes,
  FormFieldAttributesForContent,
} from "../contents/forms/types";

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
    name: keyof Context | DotNestedKeys<Context>,
  ): {
    state: "error" | "default";
    stateRelatedMessage: string | undefined;
  } | null => {
    const error = get(context.errors, name.toString());
    return error
      ? {
          state: "error" as const,
          stateRelatedMessage: "message" in error ? error.message : error,
        }
      : null;
  };

export const formErrorsToFlatErrors = (
  obj: Record<string, any>,
): Record<string, any> => {
  const errorObj: Record<string, any> = {};
  for (const key in obj) {
    if (key in obj) {
      if (typeof obj[key] === "object" && "message" in obj[key]) {
        errorObj[key] = obj[key].message;
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        errorObj[key] = formErrorsToFlatErrors(obj[key]);
      } else {
        errorObj[key] = obj[key];
      }
    }
  }
  return errorObj;
};

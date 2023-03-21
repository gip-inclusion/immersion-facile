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

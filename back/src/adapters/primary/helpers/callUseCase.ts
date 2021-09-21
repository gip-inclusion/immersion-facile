import type { UseCase } from "../../../domain/core/UseCase";
import * as yup from "yup";

export const callUseCase = async <T, R = void>({
  useCase,
  validationSchema,
  useCaseParams,
}: {
  useCase: UseCase<T, R>;
  validationSchema: yup.SchemaOf<T>;
  useCaseParams: T;
}) => {
  try {
    const params = validationSchema.validateSync(useCaseParams, {
      abortEarly: false,
    }) as T;
    return useCase.execute(params);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

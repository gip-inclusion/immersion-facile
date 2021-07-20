import type { UseCase } from "../../../domain/core/UseCase";
import * as yup from "yup";

export const callUseCase = async <T extends Record<string, unknown>, R = void>({
  useCase,
  validationSchema,
  useCaseParams,
}: {
  useCase: UseCase<T, R>;
  validationSchema: yup.SchemaOf<T>;
  useCaseParams: any;
}) => {
  const params = validationSchema.validateSync(useCaseParams, {
    abortEarly: false,
  }) as T;
  return useCase.execute(params);
};

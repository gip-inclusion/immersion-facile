import type { UseCase } from "../../../domain/core/UseCase";
import * as yup from "yup";

export const callUseCase = async <Input, Output = void>({
  useCase,
  validationSchema,
  useCaseParams,
}: {
  useCase: UseCase<Input, Output>;
  validationSchema: yup.SchemaOf<Input>;
  useCaseParams: Input;
}) => {
  try {
    const params = validationSchema.validateSync(useCaseParams, {
      abortEarly: false,
    }) as Input;
    return useCase.execute(params);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

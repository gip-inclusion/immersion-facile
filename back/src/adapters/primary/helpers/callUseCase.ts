import { BadRequestError } from "./sendHttpResponse";
import { z } from "zod";
import type { UseCase } from "../../../domain/core/UseCase";
import { MagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export const callUseCase = async <Input, Output = void>({
  useCase,
  validationSchema,
  useCaseParams,
  jwtPayload,
}: {
  useCase: UseCase<Input, Output>;
  validationSchema: z.ZodSchema<Input>;
  useCaseParams: Input;
  jwtPayload?: MagicLinkPayload;
}) => {
  try {
    let params: Input;
    try {
      params = validationSchema.parse(useCaseParams) as Input;
    } catch (error) {
      throw new BadRequestError(error);
    }

    return useCase.execute(params, jwtPayload);
  } catch (error) {
    logger.error({ error }, "callUseCase failed");
    throw error;
  }
};

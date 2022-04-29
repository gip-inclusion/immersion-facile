import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import {
  ImmersionApplicationDto,
  WithImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { withImmersionApplicationIdSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

export class GetImmersionApplication extends UseCase<
  WithImmersionApplicationId,
  ImmersionApplicationDto
> {
  constructor(
    readonly immersionApplicationRepository: ImmersionApplicationRepository,
  ) {
    super();
  }

  inputSchema = withImmersionApplicationIdSchema;

  public async _execute({
    id,
  }: WithImmersionApplicationId): Promise<ImmersionApplicationDto> {
    const immersionApplicationEntity =
      await this.immersionApplicationRepository.getById(id);
    if (
      !immersionApplicationEntity ||
      immersionApplicationEntity.status === "CANCELLED"
    )
      throw new NotFoundError(id);
    return immersionApplicationEntity.toDto();
  }
}

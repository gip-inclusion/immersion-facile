import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import {
  ImmersionApplicationDto,
  WithImmersionApplicationId,
} from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { withImmersionApplicationIdSchema } from "../../../shared/ImmersionApplication/immersionApplication.schema";

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

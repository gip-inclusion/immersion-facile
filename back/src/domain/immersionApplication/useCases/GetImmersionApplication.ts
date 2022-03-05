import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import {
  ImmersionApplicationDto,
  WithImmersionApplicationId,
  withImmersionApplicationIdSchema,
} from "../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

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
    if (!immersionApplicationEntity) throw new NotFoundError(id);
    return immersionApplicationEntity.toDto();
  }
}

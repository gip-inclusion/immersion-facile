import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ImmersionApplicationDto,
  GetImmersionApplicationRequestDto,
  getImmersionApplicationRequestDtoSchema,
} from "../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

export class GetImmersionApplication extends UseCase<
  GetImmersionApplicationRequestDto,
  ImmersionApplicationDto
> {
  constructor(
    readonly immersionApplicationRepository: ImmersionApplicationRepository,
  ) {
    super();
  }

  inputSchema = getImmersionApplicationRequestDtoSchema;

  public async _execute({
    id,
  }: GetImmersionApplicationRequestDto): Promise<ImmersionApplicationDto> {
    const immersionApplicationEntity =
      await this.immersionApplicationRepository.getById(id);
    if (!immersionApplicationEntity) throw new NotFoundError(id);
    return immersionApplicationEntity.toDto();
  }
}

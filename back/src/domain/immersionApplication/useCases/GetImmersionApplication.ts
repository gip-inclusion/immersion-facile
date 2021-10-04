import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ImmersionApplicationDto,
  GetImmersionApplicationRequestDto,
} from "../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

export class GetImmersionApplication
  implements
    UseCase<GetImmersionApplicationRequestDto, ImmersionApplicationDto>
{
  constructor(
    readonly immersionApplicationRepository: ImmersionApplicationRepository,
  ) {}

  public async execute({
    id,
  }: GetImmersionApplicationRequestDto): Promise<ImmersionApplicationDto> {
    const immersionApplicationEntity =
      await this.immersionApplicationRepository.getById(id);
    if (!immersionApplicationEntity) throw new NotFoundError(id);
    return immersionApplicationEntity.toDto();
  }
}

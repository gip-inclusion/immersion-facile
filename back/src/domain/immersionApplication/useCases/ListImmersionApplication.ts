import {
  ImmersionApplicationDto,
  ListImmersionApplicationRequestDto,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { UseCase } from "../../core/UseCase";
import { listImmersionApplicationRequestDtoSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";
import { ImmersionApplicationQueries } from "../ports/ImmersionApplicationQueries";

export class ListImmersionApplication extends UseCase<
  ListImmersionApplicationRequestDto,
  ImmersionApplicationDto[]
> {
  constructor(
    private readonly immersionApplicationQueries: ImmersionApplicationQueries,
  ) {
    super();
  }

  inputSchema = listImmersionApplicationRequestDtoSchema;

  public async _execute({
    status,
    agencyId,
  }: ListImmersionApplicationRequestDto) {
    const entities = await this.immersionApplicationQueries.getLatestUpdated();
    return entities
      .map((entity) => entity.toDto())
      .filter((dto) => !status || dto.status === status)
      .filter((dto) => !agencyId || dto.agencyId === agencyId);
  }
}

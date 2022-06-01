import {
  ConventionDto,
  ListConventionsRequestDto,
} from "shared/src/convention/convention.dto";
import { UseCase } from "../../core/UseCase";
import { listConventionsRequestSchema } from "shared/src/convention/convention.schema";
import { ConventionQueries } from "../ports/ConventionQueries";

export class ListImmersionApplication extends UseCase<
  ListConventionsRequestDto,
  ConventionDto[]
> {
  constructor(private readonly conventionQueries: ConventionQueries) {
    super();
  }

  inputSchema = listConventionsRequestSchema;

  public async _execute({ status, agencyId }: ListConventionsRequestDto) {
    const entities = await this.conventionQueries.getLatestUpdated();
    return entities
      .map((entity) => entity.toDto())
      .filter((dto) => !status || dto.status === status)
      .filter((dto) => !agencyId || dto.agencyId === agencyId);
  }
}

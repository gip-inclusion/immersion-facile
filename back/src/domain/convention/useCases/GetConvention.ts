import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UseCase } from "../../core/UseCase";
import {
  ConventionReadDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { withConventionIdSchema } from "shared/src/convention/convention.schema";
import { ConventionQueries } from "../ports/ConventionQueries";

export class GetConvention extends UseCase<
  WithConventionId,
  ConventionReadDto
> {
  constructor(readonly conventionQueries: ConventionQueries) {
    super();
  }

  inputSchema = withConventionIdSchema;

  public async _execute({ id }: WithConventionId): Promise<ConventionReadDto> {
    const convention = await this.conventionQueries.getConventionById(id);
    if (!convention || convention.status === "CANCELLED")
      throw new NotFoundError(id);
    return convention;
  }
}

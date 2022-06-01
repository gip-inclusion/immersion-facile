import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UseCase } from "../../core/UseCase";
import { ConventionRepository } from "../ports/ConventionRepository";
import {
  ConventionDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { withConventionIdSchema } from "shared/src/convention/convention.schema";

export class GetImmersionApplication extends UseCase<
  WithConventionId,
  ConventionDto
> {
  constructor(readonly conventionRepository: ConventionRepository) {
    super();
  }

  inputSchema = withConventionIdSchema;

  public async _execute({ id }: WithConventionId): Promise<ConventionDto> {
    const convention = await this.conventionRepository.getById(id);
    if (!convention || convention.status === "CANCELLED")
      throw new NotFoundError(id);
    return convention.toDto();
  }
}

import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { siretSchema } from "../../../shared/siret";
import { UseCase } from "../../core/UseCase";
import { SireneRepository } from "../ports/SireneRepository";

export class GetSiret extends UseCase<string, Object> {
  constructor(private readonly sireneRepository: SireneRepository) {
    super();
  }

  inputSchema = siretSchema;

  public async _execute(siret: string): Promise<Object> {
    const response = await this.sireneRepository.get(siret);
    if (!response) {
      throw new NotFoundError(siret);
    }
    return response;
  }
}

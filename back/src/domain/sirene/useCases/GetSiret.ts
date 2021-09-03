import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { UseCase } from "../../core/UseCase";
import { SireneRepository } from "../ports/SireneRepository";

type GetSiretDependencies = { sireneRepository: SireneRepository };

export class GetSiret implements UseCase<string, Object> {
  private readonly sireneRepository: SireneRepository;

  constructor({ sireneRepository: sireneRepository }: GetSiretDependencies) {
    this.sireneRepository = sireneRepository;
  }

  public async execute(siret: string): Promise<Object> {
    const response = await this.sireneRepository.get(siret);
    if (!response) {
      throw new NotFoundError(siret);
    }
    return response;
  }
}

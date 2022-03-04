import { FormEstablishmentDto } from "../../shared/FormEstablishmentDto";
import { FormEstablishmentRepository } from "../../domain/immersionOffer/ports/FormEstablishmentRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  private formEstablishments: FormEstablishmentDto[] = [];

  public async save(dto: FormEstablishmentDto): Promise<string | undefined> {
    if (await this.getBySiret(dto.siret)) {
      logger.info({ dto: dto }, "Immersion DTO is already in the list");
      return;
    }
    logger.debug({ immersionOffer: dto }, "Saving a new Immersion Offer");
    this.formEstablishments.push(dto);
    return dto.siret;
  }

  public async getAll() {
    return this.formEstablishments;
  }

  public async getBySiret(
    siret: string,
  ): Promise<FormEstablishmentDto | undefined> {
    return this.formEstablishments.find(
      (immersionOffer) => immersionOffer.siret === siret,
    );
  }
}

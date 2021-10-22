import {
  FormEstablishmentId,
  FormEstablishmentDto,
} from "../../shared/FormEstablishmentDto";
import { FormEstablishmentRepository } from "../../domain/immersionOffer/ports/FormEstablishmentRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  private immersionOffers: FormEstablishmentDto[] = [];

  public async save(
    dto: FormEstablishmentDto,
  ): Promise<FormEstablishmentId | undefined> {
    if (await this.getById(dto.id)) {
      logger.info({ dto: dto }, "Immersion DTO is already in the list");
      return;
    }
    logger.debug({ immersionOffer: dto }, "Saving a new Immersion Offer");
    this.immersionOffers.push(dto);
    return dto.id;
  }

  public async getAll() {
    return this.immersionOffers;
  }

  public async getById(
    id: FormEstablishmentId,
  ): Promise<FormEstablishmentDto | undefined> {
    return this.immersionOffers.find(
      (immersionOffer) => immersionOffer.id === id,
    );
  }
}

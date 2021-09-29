import {
  ImmersionOfferId,
  ImmersionOfferDto,
} from "../../shared/ImmersionOfferDto";
import { ImmersionOfferRepository } from "../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private immersionOffers: ImmersionOfferDto[] = [];
  private readonly logger = logger.child({
    logsource: "InMemoryImmersionOfferRepository",
  });

  public async save(
    dto: ImmersionOfferDto,
  ): Promise<ImmersionOfferId | undefined> {
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
    id: ImmersionOfferId,
  ): Promise<ImmersionOfferDto | undefined> {
    return this.immersionOffers.find(
      (immersionOffer) => immersionOffer.id === id,
    );
  }
}

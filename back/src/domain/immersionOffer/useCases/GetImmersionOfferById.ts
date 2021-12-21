import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ImmersionOfferId,
  immersionOfferIdSchema,
  SearchContact,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { UseCase } from "../../core/UseCase";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";

export class GetImmersionOfferById extends UseCase<
  ImmersionOfferId,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = immersionOfferIdSchema;

  public async _execute(
    immersionOfferId: ImmersionOfferId,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const establishment =
      await this.immersionOfferRepository.getEstablishmentByImmersionOfferId(
        immersionOfferId,
      );
    const offer = await this.immersionOfferRepository.getImmersionOfferById(
      immersionOfferId,
    );
    const contact =
      await this.immersionOfferRepository.getContactByImmersionOfferId(
        immersionOfferId,
      );

    if (!establishment || !offer) throw new NotFoundError(immersionOfferId);

    const contactDetails: SearchContact | undefined =
      !!contact && !!apiConsumer
        ? {
            id: contact.id,
            lastName: contact.lastName,
            firstName: contact.firstName,
            email: contact.email,
            role: contact.job,
            phone: contact.phone,
          }
        : undefined;

    const searchImmersionResultDto: SearchImmersionResultDto = {
      id: immersionOfferId,
      // Establishment informations
      address: establishment.address,
      location: establishment.position,
      naf: establishment.naf,
      name: establishment.name,
      siret: establishment.siret,
      voluntaryToImmersion: establishment.voluntaryToImmersion,
      contactMode: establishment.contactMethod,

      // Offer information
      rome: offer.rome,

      // Contact informations
      contactDetails,

      // Complementary informations
      city: "xxxx",
      nafLabel: "xxxx",
      romeLabel: "xxxx",
      distance_m: undefined,
    };

    return searchImmersionResultDto;
  }
}

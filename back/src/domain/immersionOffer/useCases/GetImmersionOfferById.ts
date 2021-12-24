import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ImmersionOfferId,
  immersionOfferIdSchema,
  SearchContact,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { extractCityFromAddress } from "../../../utils/extractCityFromAddress";
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
    const annotatedEstablishment =
      await this.immersionOfferRepository.getAnnotatedEstablishmentByImmersionOfferId(
        immersionOfferId,
      );
    const annotatedOffer =
      await this.immersionOfferRepository.getAnnotatedImmersionOfferById(
        immersionOfferId,
      );
    const contact =
      await this.immersionOfferRepository.getContactByImmersionOfferId(
        immersionOfferId,
      );

    if (!annotatedEstablishment || !annotatedOffer)
      throw new NotFoundError(immersionOfferId);

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
      address: annotatedEstablishment.address,
      location: annotatedEstablishment.position,
      naf: annotatedEstablishment.naf,
      nafLabel: annotatedEstablishment.nafLabel,
      name: annotatedEstablishment.name,
      siret: annotatedEstablishment.siret,
      voluntaryToImmersion: annotatedEstablishment.voluntaryToImmersion,
      contactMode: annotatedEstablishment.contactMethod,

      // Offer information
      rome: annotatedOffer.rome,
      romeLabel: annotatedOffer.romeLabel,

      // Contact informations
      contactDetails,

      // Complementary informations
      city: extractCityFromAddress(annotatedEstablishment.address),
      distance_m: undefined,
    };

    return searchImmersionResultDto;
  }
}

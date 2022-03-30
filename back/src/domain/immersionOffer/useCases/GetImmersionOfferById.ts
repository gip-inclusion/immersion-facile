import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { ImmersionOfferId } from "../../../shared/ImmersionOfferId";
import {
  SearchContactDto,
  SearchImmersionResultDto,
} from "../../../shared/searchImmersion/SearchImmersionResult.dto";
import { immersionOfferIdSchema } from "../../../shared/searchImmersion/SearchImmersionResult.schema";
import { extractCityFromAddress } from "../../../utils/extractCityFromAddress";
import { UseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

export class GetImmersionOfferById extends UseCase<
  ImmersionOfferId,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
  ) {
    super();
  }

  inputSchema = immersionOfferIdSchema;

  public async _execute(
    immersionOfferId: ImmersionOfferId,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const annotatedEstablishment =
      await this.establishmentAggregateRepository.getAnnotatedEstablishmentByImmersionOfferId(
        immersionOfferId,
      );
    const annotatedOffer =
      await this.establishmentAggregateRepository.getAnnotatedImmersionOfferById(
        immersionOfferId,
      );
    const contact =
      await this.establishmentAggregateRepository.getContactByImmersionOfferId(
        immersionOfferId,
      );

    if (!annotatedEstablishment || !annotatedOffer)
      throw new NotFoundError(immersionOfferId);

    const contactDetails: SearchContactDto | undefined =
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
      naf: annotatedEstablishment.nafDto.code,
      nafLabel: annotatedEstablishment.nafLabel,
      name: annotatedEstablishment.name,
      siret: annotatedEstablishment.siret,
      voluntaryToImmersion: annotatedEstablishment.voluntaryToImmersion,
      contactMode: contact?.contactMethod,

      // Offer information
      rome: annotatedOffer.romeCode,
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

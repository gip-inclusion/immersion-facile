import { prop } from "ramda";
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
    immersionOfferId: string,
    apiConsumer?: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const [siret, romeCode] = immersionOfferId.split("-");

    const establishment =
      await this.establishmentAggregateRepository.getEstablishmentForSiret(
        siret,
      );

    const appellationsDtos = (
      await this.establishmentAggregateRepository.getOffersAsAppelationDtoForFormEstablishment(
        siret,
      )
    ).filter((appellationDto) => appellationDto.romeCode === romeCode);

    const contact =
      await this.establishmentAggregateRepository.getContactForEstablishmentSiret(
        siret,
      );

    if (!establishment || !appellationsDtos.length)
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
      // Establishment informations
      address: establishment.address,
      location: establishment.position,
      naf: establishment.nafDto.code,
      nafLabel: establishment.nafLabel,
      name: establishment.name,
      siret: establishment.siret,
      voluntaryToImmersion: establishment.voluntaryToImmersion,
      contactMode: contact?.contactMethod,

      // Offer information
      rome: appellationsDtos[0].romeCode,
      romeLabel: appellationsDtos[0].romeLabel,
      appellationLabels: appellationsDtos.map(prop("appellationLabel")),

      // Contact informations
      contactDetails,

      // Complementary informations
      city: extractCityFromAddress(establishment.address),
      distance_m: undefined,
    };

    return searchImmersionResultDto;
  }
}

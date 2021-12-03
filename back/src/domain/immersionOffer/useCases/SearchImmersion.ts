// import promClient from "prom-client";
import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { UseCase } from "../../core/UseCase";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";

// const countRequests = new promClient.Counter({
//   name: "sendinblue_send_transac_email_total",
//   help: "The total count of sendTransacEmail requests, broken down by email type.",
//   labelNames: ["emailType"],
// });

export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    params: SearchImmersionRequestDto,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchParams = convertRequestDtoToSearchParams(params);
    await this.immersionOfferRepository.insertSearch(searchParams);
    const apiConsumerName = apiConsumer?.name;
    // TODO: count api calls with prometheus
    return this.immersionOfferRepository.getFromSearch(
      searchParams,
      apiConsumerName !== undefined,
    );
  }
}

const convertRequestDtoToSearchParams = ({
  rome,
  nafDivision,
  siret,
  location,
  distance_km,
}: SearchImmersionRequestDto): SearchParams => ({
  rome: rome,
  nafDivision,
  siret,
  lat: location.lat,
  lon: location.lon,
  distance_km,
});

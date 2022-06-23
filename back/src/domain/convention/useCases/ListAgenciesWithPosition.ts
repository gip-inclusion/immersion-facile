import {
  AgencyDto,
  AgencyWithPositionDto,
  AgencyKindFilter,
  ListAgenciesWithPositionRequestDto,
  activeAgencyStatuses,
} from "shared/src/agency/agency.dto";
import { listAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { LatLonDto } from "shared/src/latLon";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../ports/AgencyRepository";

export class ListAgenciesWithPosition extends UseCase<
  ListAgenciesWithPositionRequestDto,
  AgencyWithPositionDto[]
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute({
    lon,
    lat,
    filter,
  }: ListAgenciesWithPositionRequestDto): Promise<AgencyWithPositionDto[]> {
    const agencies = await this.getActiveAgencies(
      lon && lat ? { lon, lat } : undefined,
      filter,
    );
    return agencies.map(agencyToAgencyWithPositionDto);
  }

  private getActiveAgencies(
    position?: LatLonDto,
    agencyKindFilter?: AgencyKindFilter,
  ): Promise<AgencyDto[]> {
    return this.agencyRepository.getAgencies({
      filters: {
        position: position
          ? {
              distance_km: 100,
              position,
            }
          : undefined,
        kind: agencyKindFilter,
        status: activeAgencyStatuses,
      },
      limit: 20,
    });
  }
}

const agencyToAgencyWithPositionDto = (
  config: AgencyDto,
): AgencyWithPositionDto => ({
  id: config.id,
  name: config.name,
  position: {
    lat: config.position.lat,
    lon: config.position.lon,
  },
});

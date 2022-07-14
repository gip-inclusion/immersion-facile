import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyKindFilter,
  AgencyWithPositionDto,
  ListAgenciesWithPositionRequestDto,
} from "shared/src/agency/agency.dto";
import { listAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { LatLonDto } from "shared/src/latLon";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAgenciesWithPosition extends TransactionalUseCase<
  ListAgenciesWithPositionRequestDto,
  AgencyWithPositionDto[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute(
    { lon, lat, filter }: ListAgenciesWithPositionRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyWithPositionDto[]> {
    const agencies = await getActiveAgencies(
      uow,
      lon && lat ? { lon, lat } : undefined,
      filter,
    );
    return agencies.map(agencyToAgencyWithPositionDto);
  }
}

const getActiveAgencies = (
  uow: UnitOfWork,
  position?: LatLonDto,
  agencyKindFilter?: AgencyKindFilter,
): Promise<AgencyDto[]> =>
  uow.agencyRepository.getAgencies({
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

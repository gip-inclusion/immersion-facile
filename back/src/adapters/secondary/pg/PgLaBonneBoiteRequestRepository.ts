import { PoolClient } from "pg";
import { LaBonneBoiteRequestEntity } from "../../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestParams } from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteRequestRepository } from "../../../domain/immersionOffer/ports/LaBonneBoiteRequestRepository";
import { LatLonDto } from "shared/src/latLon";

export class PgLaBonneBoiteRequestRepository
  implements LaBonneBoiteRequestRepository
{
  constructor(private client: PoolClient) {}

  public async insertLaBonneBoiteRequest(
    laBonneBoiteRequest: LaBonneBoiteRequestEntity,
  ) {
    await this.client.query(
      `INSERT INTO lbb_requests (
         requested_at, rome, lat, lon, distance_km, result
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        laBonneBoiteRequest.requestedAt,
        laBonneBoiteRequest.params.rome,
        laBonneBoiteRequest.params.lat,
        laBonneBoiteRequest.params.lon,
        laBonneBoiteRequest.params.distance_km,
        laBonneBoiteRequest.result,
      ],
    );
  }

  public async getClosestRequestParamsWithThisRomeSince({
    rome: thisRome,
    position: thisPosition,
    since,
  }: {
    rome: string;
    position: LatLonDto;
    since: Date;
  }): Promise<null | {
    params: LaBonneBoiteRequestParams;
    distanceToPositionKm: number;
  }> {
    // TODO : Do not inject those parameters, use $ instead.
    const sql = `
    SELECT
      lon, lat, rome, distance_km,
      ST_DistanceSphere(ST_MakePoint($1, $2), ST_MakePoint(lon, lat)) AS distance_to_position_meters
    FROM lbb_requests
    WHERE rome = $3 AND  requested_at >= $4
      ORDER BY distance_to_position_meters ASC
      LIMIT 1;`;

    const result = await this.client.query(sql, [
      thisPosition.lon,
      thisPosition.lat,
      thisRome,
      since.toISOString(),
    ]);
    if (result.rowCount === 0) return null;
    const row = result.rows[0];
    return {
      params: {
        distance_km: row.distance_km,
        lon: row.lon,
        lat: row.lat,
        rome: row.rome,
      },
      distanceToPositionKm: row.distance_to_position_meters / 1000,
    };
  }
}

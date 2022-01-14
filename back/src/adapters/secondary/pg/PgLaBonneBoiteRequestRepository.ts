import { PoolClient } from "pg";
import { LaBonneBoiteRequestEntity } from "../../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestParams } from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteRequestRepository } from "../../../domain/immersionOffer/ports/LaBonneBoiteRequestRepository";
import { LatLonDto } from "../../../shared/SearchImmersionDto";

export class PgLaBonneBoiteRequestRepository
  implements LaBonneBoiteRequestRepository
{
  constructor(private client: PoolClient) {}

  public async insertLaBonneBoiteRequest(
    laBonneBoiteRequest: LaBonneBoiteRequestEntity,
  ) {
    await this.client.query(
      `INSERT INTO lbb_request (
         requested_at, rome, lat, lon, distance_km, result
       ) VALUES ($1, $2, $3, $4, $5, $6) `,
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
    const sql = `
    SELECT 
      lon, lat, rome,
      ST_DistanceSphere(ST_MakePoint(${thisPosition.lon}, ${
      thisPosition.lat
    }), ST_MakePoint(lon, lat)) AS distance_to_position_meters
    FROM lbb_request
    WHERE rome = '${thisRome}' AND  requested_at >= '${since.toISOString()}'
      ORDER BY distance_to_position_meters ASC
      LIMIT 1;`;

    const result = await this.client.query(sql);
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

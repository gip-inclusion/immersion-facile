import { ImmersionOfferRepository } from "../../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { ImmersionOfferEntity } from "../../../domain/searchImmersion/entities/ImmersionOfferEntity";
import { Client, QueryResult } from "pg";
import format from "pg-format";
import { SearchParams } from "../../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";
import { EstablishmentEntity } from "../../../domain/searchImmersion/entities/EstablishmentEntity";
import { ENV } from "../../primary/environmentVariables";

const logger = createLogger(__filename);

export class PgImmersionOfferRepository implements ImmersionOfferRepository {
  constructor(private client: Client) {}

  //TODO
  async getAll(): Promise<ImmersionOfferEntity[]> {
    const vary = await this.client.query("SELECT * FROM immersion_proposals");

    return [];
  }

  async insertSearch(searchParams: SearchParams) {
    return this.client
      .query(
        "INSERT INTO searches_made (ROME, lat, lon ,distance, needsToBeSearched) VALUES ($1, $2, $3, $4, $5) ON CONFLICT ON CONSTRAINT pk_searches_made DO UPDATE SET needstobesearched=true, update_date=NOW()",
        [
          searchParams.ROME,
          searchParams.lat,
          searchParams.lon,
          searchParams.distance,
          true,
        ],
      )
      .then((res) => {
        return res;
      })
      .catch((e) => {
        return e;
      });
  }

  async getSearchesMadeAndNotInserted(): Promise<SearchParams[]> {
    return this.client
      .query(
        "UPDATE searches_made SET needstobesearched=false WHERE needstobesearched=true RETURNING ROME, lat, lon ,distance",
      )
      .then((res) => {
        return res.rows.map((x) => {
          const searchParams: SearchParams = x;
          return searchParams;
        });
      })
      .catch((e) => {
        logger.log(e);
        return [];
      });
  }
  /*
  async insertEstablishments(
    establishments: EstablishmentEntity[],
  ): Promise<QueryResult<any>> {
    const arrayOfEstablishments = establishments.map((establishment) =>
      establishment.toArrayOfProps(),
    );

    return this.client
      .query(
        format(
          "INSERT INTO establishments (siret, name, address,number_employees, naf, contact_mode, data_source, update_date, creation_date) VALUES %L ON CONFLICT ON CONSTRAINT pk_establishments DO UPDATE SET name=EXCLUDED.name, address=EXCLUDED.address, number_employees=EXCLUDED.number_employees, naf=EXCLUDED.naf, contact_mode=EXCLUDED.contact_mode, data_source=EXCLUDED.data_source, update_date=NOW()",
          arrayOfEstablishments,
        ),
      )
      .then((res) => {
        return res;
      })
      .catch((e) => {
        return e;
      });
  }*/

  async insertImmersions(
    immersionOffers: ImmersionOfferEntity[],
  ): Promise<void> {
    const arrayOfImmersionsOffers = immersionOffers.map((immersion) =>
      immersion.toArrayOfProps(),
    );

    await this.client.query(
      format(
        "INSERT INTO immersion_proposals (uuid, rome, naf,siret, name, data_source, score) VALUES %L ON CONFLICT ON CONSTRAINT pk_immersion_proposals DO UPDATE SET name=EXCLUDED.name, update_date=NOW()",
        arrayOfImmersionsOffers,
      ),
    );
  }

  async getFromSearch(
    rome: string,
    localisation: [number, number],
  ): Promise<ImmersionOfferEntity[]> {
    return [];
  }
}

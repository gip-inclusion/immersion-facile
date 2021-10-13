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

  async markPendingResearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
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
        logger.info(e);
        return [];
      });
  }

  public async insertEstablishments(
    establishments: EstablishmentEntity[],
  ): Promise<void> {
    const arrayOfEstablishments = establishments.map((establishment) =>
      establishment.toArrayOfProps(),
    );

    //We deduplicate establishments because postgres does not support duplicate rows
    const deduplicatedArrayOfEstablishments = arrayOfEstablishments.reduce(
      (acc, cur) => {
        const alreadyExist = acc.some((item: any[]) => item[0] === cur[0]);
        if (alreadyExist) return acc;
        return [...acc, cur];
      },
      [],
    );
    await this.client
      .query(
        format(
          "INSERT INTO establishments (siret, name, address,number_employees, naf, contact_mode, \
          data_source) VALUES %L ON CONFLICT ON CONSTRAINT pk_establishments DO UPDATE SET \
          name=EXCLUDED.name, address=EXCLUDED.address, number_employees=EXCLUDED.number_employees, \
          naf=EXCLUDED.naf, contact_mode=EXCLUDED.contact_mode, data_source=EXCLUDED.data_source, \
          update_date=NOW() \
          WHERE EXCLUDED.data_source='form' OR (establishments.data_source != 'form' AND \
          (EXCLUDED.data_source = 'api_laplateformedelinclusion' AND establishments.data_source = 'api_labonneboite')) ",
          deduplicatedArrayOfEstablishments,
        ),
      )
      .then((res) => {
        return res;
      })
      .catch((e) => {
        console.log(e);
        return e;
      });
  }

  async insertImmersions(
    immersionOffers: ImmersionOfferEntity[],
  ): Promise<void> {
    const arrayOfImmersionsOffers = immersionOffers.map((immersion) =>
      immersion.toArrayOfProps(),
    );
    //We deduplicate establishments because postgres does not support duplicate rows
    const deduplicatedArrayOfImmersionsOffers = arrayOfImmersionsOffers.reduce(
      (acc: any[][], cur: any[]) => {
        const alreadyExist = acc.some(
          (item: any[]) =>
            item[1] === cur[1] && item[2] === cur[2] && item[3] === cur[3],
        );
        if (alreadyExist) return acc;
        return [...acc, cur];
      },
      [],
    );

    await this.client.query(
      format(
        "INSERT INTO immersion_offers (uuid, rome, division, siret, naf,  name,voluntary_to_immersion, data_source, score) VALUES %L ON CONFLICT ON CONSTRAINT pk_immersion_offers DO UPDATE SET naf=EXCLUDED.naf, name=EXCLUDED.name, voluntary_to_immersion=EXCLUDED.voluntary_to_immersion, \
        data_source=EXCLUDED.data_source, score=EXCLUDED.score, update_date=NOW() \
        WHERE EXCLUDED.data_source='form' OR (immersion_offers.data_source != 'form' AND \
        (EXCLUDED.data_source = 'api_laplateformedelinclusion' AND immersion_offers.data_source = 'api_labonneboite')) ",
        deduplicatedArrayOfImmersionsOffers,
      ),
    );
  }

  async getImmersionsFromSiret(siret: string) {
    return this.client
      .query("SELECT * FROM immersion_offers WHERE siret=$1", [siret])
      .then((res) => {
        return res.rows.map((x) => {
          return x;
        });
      })
      .catch((e) => {
        logger.info(e);
        return [];
      });
  }

  async getEstablishmentFromSiret(siret: string) {
    return this.client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => {
        return res.rows.map((x) => {
          return x;
        });
      })
      .catch((e) => {
        logger.info(e);
        return [];
      });
  }
  async getFromSearch(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    return [];
  }
  async getSearchInDatabase(searchParams: SearchParams) {
    return this.client
      .query(
        "SELECT * FROM searches_made WHERE rome=$1 AND lat=$2 AND lon=$3 AND distance=$4",
        [
          searchParams.ROME,
          searchParams.lat,
          searchParams.lon,
          searchParams.distance,
        ],
      )
      .then((res) => {
        console.log;
        return res.rows.map((x) => {
          return x;
        });
      })
      .catch((e) => {
        logger.info(e);
        return [];
      });
  }
}

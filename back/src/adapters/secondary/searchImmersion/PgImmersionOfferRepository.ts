import { ImmersionOfferRepository } from "../../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { ImmersionOfferEntity } from "../../../domain/searchImmersion/entities/ImmersionOfferEntity";
import { Client, QueryResult } from "pg";
import format from "pg-format";

export class PgImmersionOfferRepository implements ImmersionOfferRepository {
  private client: Client;

  constructor() {
    this.client = new Client({
      user: "postgres",
      host: "localhost",
      database: "immersion-db",
      password: "pg-password",
      port: 5432,
    });
  }

  async connect() {
    await this.client.connect();
  }
  async getAll(): Promise<ImmersionOfferEntity[]> {
    const vary = await this.client.query("SELECT * FROM immersion_proposals");

    return [];
  }

  async insertImmersions(
    immersionOffers: ImmersionOfferEntity[]
  ): Promise<QueryResult<any>> {
    const arrayOfImmersionsOffers = immersionOffers.map((immersion) =>
      immersion.toArrayOfProps()
    );
    return this.client
      .query(
        format(
          "INSERT INTO immersion_proposals (uuid, name, naf, rome, siret) VALUES %L",
          arrayOfImmersionsOffers
        )
      )
      .then((res) => {
        return res;
      })
      .catch((e) => {
        return e;
      });
  }

  async getFromSearch(
    rome: string,
    localisation: [number, number]
  ): Promise<ImmersionOfferEntity[]> {
    return [];
  }
}

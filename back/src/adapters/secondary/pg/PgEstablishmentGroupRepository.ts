import { PoolClient } from "pg";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

export class PgEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  constructor(private client: PoolClient) {}

  async save(_group: EstablishmentGroupEntity): Promise<void> {
    throw new Error("Not implemented");
    return Promise.resolve(undefined);
  }
}

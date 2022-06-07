import { PoolClient } from "pg";
import { ConventionId } from "shared/src/convention/convention.dto";
import { PeExternalId } from "shared/src/federatedIdentities/federatedIdentity.dto";
import {
  ConventionPoleEmploiUserAdvisorDto,
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
} from "../../../domain/peConnect/dto/PeConnect.dto";
import {
  ConventionAndPeExternalIds,
  ConventionPoleEmploiAdvisorRepository,
} from "../../../domain/peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { conventionPoleEmploiUserAdvisorDtoSchema } from "../../../domain/peConnect/port/PeConnect.schema";

const CONVENTION_ID_DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

export class PgConventionPoleEmploiAdvisorRepository
  implements ConventionPoleEmploiAdvisorRepository
{
  constructor(private client: PoolClient) {}

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    peExternalId: PeExternalId,
  ): Promise<ConventionAndPeExternalIds> {
    const pgResult = await this.client.query(
      `
      UPDATE partners_pe_connect
      SET convention_id = $1
      WHERE user_pe_external_id = $2
      AND convention_id = $3`,
      [conventionId, peExternalId, CONVENTION_ID_DEFAULT_UUID],
    );

    if (pgResult.rowCount != 1)
      throw new Error("Association between Convention and userAdvisor failed");

    return {
      conventionId,
      peExternalId,
    };
  }

  public async openSlotForNextConvention(
    conventionPoleEmploiUserAdvisorEntity: PoleEmploiUserAdvisorDto,
  ): Promise<void> {
    const { userPeExternalId, firstName, lastName, email, type } =
      conventionPoleEmploiUserAdvisorEntity;

    await this.client.query(upsertOnCompositePrimaryKeyConflict, [
      userPeExternalId,
      CONVENTION_ID_DEFAULT_UUID,
      firstName,
      lastName,
      email,
      type,
    ]);
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntity> {
    const pgResult = await this.client.query(
      `SELECT *
       FROM partners_pe_connect
       WHERE convention_id = $1`,
      [conventionId],
    );

    return toConventionPoleEmploiUserAdvisorEntity(
      conventionPoleEmploiUserAdvisorDtoSchema.parse(
        toConventionPoleEmploiUserAdvisorDTO(pgResult.rows[0]),
      ),
    );
  }
}

type RawResults = {
  user_pe_external_id: any;
  convention_id: any;
  firstname: any;
  lastname: any;
  email: any;
  type: any;
};

const toConventionPoleEmploiUserAdvisorDTO = ({
  user_pe_external_id,
  convention_id,
  firstname,
  lastname,
  email,
  type,
}: RawResults): ConventionPoleEmploiUserAdvisorDto => ({
  userPeExternalId: user_pe_external_id,
  conventionId: convention_id,
  firstName: firstname,
  lastName: lastname,
  email,
  type,
});

const toConventionPoleEmploiUserAdvisorEntity = (
  dto: ConventionPoleEmploiUserAdvisorDto,
): ConventionPoleEmploiUserAdvisorEntity => ({
  ...dto,
  _entityName: "ConventionPoleEmploiAdvisor",
});

// On primary key conflict we update the data columns (firstname, lastname, email, type) with the new values.
// (the special EXCLUDED table is used to reference values originally proposed for insertion)
// ref: https://www.postgresql.org/docs/current/sql-insert.html
const upsertOnCompositePrimaryKeyConflict = `
      INSERT INTO partners_pe_connect(user_pe_external_id, convention_id, firstname, lastname, email, type) 
      VALUES($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (user_pe_external_id, convention_id) DO UPDATE 
      SET (firstname, lastname, email, type) = (EXCLUDED.firstname, EXCLUDED.lastname, EXCLUDED.email, EXCLUDED.type)`;

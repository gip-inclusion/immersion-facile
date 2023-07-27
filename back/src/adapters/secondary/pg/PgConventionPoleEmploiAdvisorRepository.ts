import { PoolClient } from "pg";
import {
  ConventionId,
  parseZodSchemaAndLogErrorOnParsingFailure,
  PeExternalId,
} from "shared";
import {
  ConventionPoleEmploiUserAdvisorDto,
  ConventionPoleEmploiUserAdvisorEntity,
  PeUserAndAdvisor,
} from "../../../domain/peConnect/dto/PeConnect.dto";
import { isPeAdvisorImmersionKind } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import {
  ConventionAndPeExternalIds,
  ConventionPoleEmploiAdvisorRepository,
} from "../../../domain/peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { conventionPoleEmploiUserAdvisorDtoSchema } from "../../../domain/peConnect/port/PeConnect.schema";
import { createLogger } from "../../../utils/logger";

const CONVENTION_ID_DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

const logger = createLogger(__filename);

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
      throw new Error(
        `Association between Convention and userAdvisor failed. rowCount: ${pgResult.rowCount}, conventionId: ${conventionId}, peExternalId: ${peExternalId}`,
      );

    return {
      conventionId,
      peExternalId,
    };
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntity | undefined> {
    const pgResult =
      await this.client.query<PgConventionPoleEmploiUserAdvisorDto>(
        `SELECT *
       FROM partners_pe_connect
       WHERE convention_id = $1`,
        [conventionId],
      );

    const result = pgResult.rows.at(0);
    const conventionPeUserAdvisor =
      result && toConventionPoleEmploiUserAdvisorDTO(result);

    return (
      conventionPeUserAdvisor &&
      toConventionPoleEmploiUserAdvisorEntity(
        parseZodSchemaAndLogErrorOnParsingFailure(
          conventionPoleEmploiUserAdvisorDtoSchema,
          conventionPeUserAdvisor,
          logger,
          { conventionPeUserAdvisor: JSON.stringify(conventionPeUserAdvisor) },
        ),
      )
    );
  }

  public async openSlotForNextConvention(
    peUserAndAdvisor: PeUserAndAdvisor,
  ): Promise<void> {
    const { user, advisor } = peUserAndAdvisor;

    await this.client.query(upsertOnCompositePrimaryKeyConflict, [
      user.peExternalId,
      CONVENTION_ID_DEFAULT_UUID,
      advisor?.firstName ?? null,
      advisor?.lastName ?? null,
      advisor?.email ?? null,
      advisor?.type ?? null,
    ]);
  }
}

export type PgConventionPoleEmploiUserAdvisorDto = {
  user_pe_external_id: string;
  convention_id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  type: string | null;
};

const toConventionPoleEmploiUserAdvisorDTO = ({
  user_pe_external_id,
  convention_id,
  firstname,
  lastname,
  email,
  type,
}: PgConventionPoleEmploiUserAdvisorDto): ConventionPoleEmploiUserAdvisorDto => ({
  advisor:
    firstname && lastname && email && type && isPeAdvisorImmersionKind(type)
      ? {
          firstName: firstname,
          lastName: lastname,
          email,
          type,
        }
      : undefined,
  peExternalId: user_pe_external_id,
  conventionId: convention_id,
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

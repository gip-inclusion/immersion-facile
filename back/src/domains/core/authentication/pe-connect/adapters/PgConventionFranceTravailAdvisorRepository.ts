import { ConventionId, FtExternalId } from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import { parseZodSchemaAndLogErrorOnParsingFailure } from "../../../../../utils/schema.utils";
import {
  ConventionFtUserAdvisorDto,
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";
import { isFtAdvisorImmersionKind } from "../dto/FtConnectAdvisor.dto";
import {
  ConventionAndFtExternalIds,
  ConventionFranceTravailAdvisorRepository,
} from "../port/ConventionFranceTravailAdvisorRepository";
import { conventionFranceTravailUserAdvisorDtoSchema } from "../port/FtConnect.schema";

const CONVENTION_ID_DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

const logger = createLogger(__filename);

export class PgConventionFranceTravailAdvisorRepository
  implements ConventionFranceTravailAdvisorRepository
{
  constructor(private transaction: KyselyDb) {}

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    peExternalId: FtExternalId,
  ): Promise<ConventionAndFtExternalIds> {
    const pgResult = await executeKyselyRawSqlQuery(
      this.transaction,
      `
      UPDATE partners_pe_connect
      SET convention_id = $1
      WHERE user_pe_external_id = $2
      AND convention_id = $3`,
      [conventionId, peExternalId, CONVENTION_ID_DEFAULT_UUID],
    );

    if (Number(pgResult.numAffectedRows) !== 1)
      throw new Error(
        `Association between Convention and userAdvisor failed. rowCount: ${pgResult.rows.length}, conventionId: ${conventionId}, peExternalId: ${peExternalId}`,
      );

    return {
      conventionId,
      peExternalId,
    };
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionFtUserAdvisorEntity | undefined> {
    const pgResult =
      await executeKyselyRawSqlQuery<PgConventionFranceTravailUserAdvisorDto>(
        this.transaction,
        `SELECT *
       FROM partners_pe_connect
       WHERE convention_id = $1`,
        [conventionId],
      );

    const result = pgResult.rows.at(0);
    const conventionPeUserAdvisor =
      result && toConventionFranceTravailUserAdvisorDTO(result);

    return (
      conventionPeUserAdvisor &&
      toConventionPoleEmploiUserAdvisorEntity(
        parseZodSchemaAndLogErrorOnParsingFailure(
          conventionFranceTravailUserAdvisorDtoSchema,
          conventionPeUserAdvisor,
          logger,
        ),
      )
    );
  }

  public async openSlotForNextConvention(
    peUserAndAdvisor: FtUserAndAdvisor,
  ): Promise<void> {
    const { user, advisor } = peUserAndAdvisor;

    await executeKyselyRawSqlQuery(
      this.transaction,
      upsertOnCompositePrimaryKeyConflict,
      [
        user.peExternalId,
        CONVENTION_ID_DEFAULT_UUID,
        advisor?.firstName ?? null,
        advisor?.lastName ?? null,
        advisor?.email ?? null,
        advisor?.type ?? null,
      ],
    );
  }
}

export type PgConventionFranceTravailUserAdvisorDto = {
  user_pe_external_id: string;
  convention_id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  type: string | null;
};

const toConventionFranceTravailUserAdvisorDTO = ({
  user_pe_external_id,
  convention_id,
  firstname,
  lastname,
  email,
  type,
}: PgConventionFranceTravailUserAdvisorDto): ConventionFtUserAdvisorDto => ({
  advisor:
    firstname && lastname && email && type && isFtAdvisorImmersionKind(type)
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
  dto: ConventionFtUserAdvisorDto,
): ConventionFtUserAdvisorEntity => ({
  ...dto,
  _entityName: "ConventionFranceTravailAdvisor",
});

// On primary key conflict we update the data columns (firstname, lastname, email, type) with the new values.
// (the special EXCLUDED table is used to reference values originally proposed for insertion)
// ref: https://www.postgresql.org/docs/current/sql-insert.html
const upsertOnCompositePrimaryKeyConflict = `
      INSERT INTO partners_pe_connect(user_pe_external_id, convention_id, firstname, lastname, email, type) 
      VALUES($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (user_pe_external_id, convention_id) DO UPDATE 
      SET (firstname, lastname, email, type) = (EXCLUDED.firstname, EXCLUDED.lastname, EXCLUDED.email, EXCLUDED.type)`;

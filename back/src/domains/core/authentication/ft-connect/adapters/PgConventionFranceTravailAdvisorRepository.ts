import { type ConventionId, errors, type FtExternalId } from "shared";
import { validateAndParseZodSchemaV2 } from "../../../../../config/helpers/validateAndParseZodSchema";
import type { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import type {
  ConventionFtUserAdvisorDto,
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";
import { isFtAdvisorImmersionKind } from "../dto/FtConnectAdvisor.dto";
import type {
  ConventionAndFtExternalIds,
  ConventionFranceTravailAdvisorRepository,
} from "../port/ConventionFranceTravailAdvisorRepository";
import { conventionFranceTravailUserAdvisorDtoSchema } from "../port/FtConnect.schema";

const logger = createLogger(__filename);

export class PgConventionFranceTravailAdvisorRepository
  implements ConventionFranceTravailAdvisorRepository
{
  constructor(private transaction: KyselyDb) {}

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    userFtExternalId: FtExternalId,
  ): Promise<ConventionAndFtExternalIds> {
    // Check if the ft user exists
    const ftUser = await this.transaction
      .selectFrom("ft_connect_users")
      .where("ft_connect_id", "=", userFtExternalId)
      .select("ft_connect_id")
      .executeTakeFirst();

    if (!ftUser)
      throw errors.ftConnect.associationFailed({
        rowCount: 0,
        conventionId,
        ftExternalId: userFtExternalId,
      });

    // Insert the association into the join table
    const result = await this.transaction
      .insertInto("conventions__ft_connect_users")
      .values({
        convention_id: conventionId,
        ft_connect_id: userFtExternalId,
      })
      .onConflict((oc) =>
        oc.columns(["convention_id", "ft_connect_id"]).doNothing(),
      )
      .returning("convention_id")
      .execute();

    if (result.length !== 1)
      throw errors.ftConnect.associationFailed({
        rowCount: result.length,
        conventionId,
        ftExternalId: userFtExternalId,
      });

    return {
      conventionId,
      ftExternalId: userFtExternalId,
    };
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionFtUserAdvisorEntity | undefined> {
    const result = await this.transaction
      .selectFrom("conventions__ft_connect_users")
      .innerJoin(
        "ft_connect_users",
        "ft_connect_users.ft_connect_id",
        "conventions__ft_connect_users.ft_connect_id",
      )
      .where("conventions__ft_connect_users.convention_id", "=", conventionId)
      .select([
        "conventions__ft_connect_users.ft_connect_id as ft_connect_id",
        "conventions__ft_connect_users.convention_id as convention_id",
        "ft_connect_users.advisor_firstname",
        "ft_connect_users.advisor_lastname",
        "ft_connect_users.advisor_email",
        "ft_connect_users.advisor_kind",
      ])
      .executeTakeFirst();

    const conventionPeUserAdvisor =
      result && toConventionFranceTravailUserAdvisorDTO(result);

    return (
      conventionPeUserAdvisor &&
      toConventionFranceTravailUserAdvisorEntity(
        validateAndParseZodSchemaV2({
          schemaName: "conventionFranceTravailUserAdvisorDtoSchema",
          inputSchema: conventionFranceTravailUserAdvisorDtoSchema,
          schemaParsingInput: conventionPeUserAdvisor,
          id: conventionPeUserAdvisor.peExternalId,
          logger,
        }),
      )
    );
  }

  public async deleteByConventionId(conventionId: ConventionId): Promise<void> {
    await this.transaction
      .deleteFrom("conventions__ft_connect_users")
      .where("convention_id", "=", conventionId)
      .execute();
  }

  public async saveFtUserAndAdvisor(
    ftUserAndAdvisor: FtUserAndAdvisor,
  ): Promise<void> {
    const { user, advisor } = ftUserAndAdvisor;

    await this.transaction
      .insertInto("ft_connect_users")
      .values({
        ft_connect_id: user.peExternalId,
        advisor_firstname: advisor?.firstName ?? null,
        advisor_lastname: advisor?.lastName ?? null,
        advisor_email: advisor?.email ?? null,
        advisor_kind: advisor?.type ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.column("ft_connect_id").doUpdateSet({
          advisor_firstname: (eb) => eb.ref("excluded.advisor_firstname"),
          advisor_lastname: (eb) => eb.ref("excluded.advisor_lastname"),
          advisor_email: (eb) => eb.ref("excluded.advisor_email"),
          advisor_kind: (eb) => eb.ref("excluded.advisor_kind"),
          updated_at: new Date(),
        }),
      )
      .execute();
  }
}

type PgConventionFranceTravailUserAdvisorDto = {
  ft_connect_id: string;
  convention_id: string;
  advisor_firstname: string | null;
  advisor_lastname: string | null;
  advisor_email: string | null;
  advisor_kind: string | null;
};

const toConventionFranceTravailUserAdvisorDTO = ({
  ft_connect_id,
  convention_id,
  advisor_firstname,
  advisor_lastname,
  advisor_email,
  advisor_kind,
}: PgConventionFranceTravailUserAdvisorDto): ConventionFtUserAdvisorDto => ({
  advisor:
    advisor_firstname &&
    advisor_lastname &&
    advisor_email &&
    advisor_kind &&
    isFtAdvisorImmersionKind(advisor_kind)
      ? {
          firstName: advisor_firstname,
          lastName: advisor_lastname,
          email: advisor_email,
          type: advisor_kind,
        }
      : undefined,
  peExternalId: ft_connect_id,
  conventionId: convention_id,
});

const toConventionFranceTravailUserAdvisorEntity = (
  dto: ConventionFtUserAdvisorDto,
): ConventionFtUserAdvisorEntity => ({
  ...dto,
  _entityName: "ConventionFranceTravailAdvisor",
});

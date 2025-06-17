import { type ConventionId, type FtExternalId, errors } from "shared";
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

const CONVENTION_ID_DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";

const logger = createLogger(__filename);

export class PgConventionFranceTravailAdvisorRepository
  implements ConventionFranceTravailAdvisorRepository
{
  constructor(private transaction: KyselyDb) {}

  public async associateConventionAndUserAdvisor(
    conventionId: ConventionId,
    userFtExternalId: FtExternalId,
  ): Promise<ConventionAndFtExternalIds> {
    const result = await this.transaction
      .updateTable("partners_pe_connect")
      .set({ convention_id: conventionId })
      .where("user_pe_external_id", "=", userFtExternalId)
      .where("convention_id", "=", CONVENTION_ID_DEFAULT_UUID)
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
      .selectFrom("partners_pe_connect")
      .where("convention_id", "=", conventionId)
      .select([
        "user_pe_external_id",
        "convention_id",
        "firstname",
        "lastname",
        "email",
        "type",
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

  public async openSlotForNextConvention(
    peUserAndAdvisor: FtUserAndAdvisor,
  ): Promise<void> {
    const { user, advisor } = peUserAndAdvisor;

    await this.transaction
      .insertInto("partners_pe_connect")
      .values({
        user_pe_external_id: user.peExternalId,
        convention_id: CONVENTION_ID_DEFAULT_UUID,
        firstname: advisor?.firstName,
        lastname: advisor?.lastName,
        email: advisor?.email,
        type: advisor?.type,
      })
      .onConflict((oc) =>
        oc.columns(["user_pe_external_id", "convention_id"]).doUpdateSet({
          firstname: (eb) => eb.ref("excluded.firstname"),
          lastname: (eb) => eb.ref("excluded.lastname"),
          email: (eb) => eb.ref("excluded.email"),
          type: (eb) => eb.ref("excluded.type"),
        }),
      )
      .execute();
  }
}

type PgConventionFranceTravailUserAdvisorDto = {
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

const toConventionFranceTravailUserAdvisorEntity = (
  dto: ConventionFtUserAdvisorDto,
): ConventionFtUserAdvisorEntity => ({
  ...dto,
  _entityName: "ConventionFranceTravailAdvisor",
});

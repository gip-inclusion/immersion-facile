import { PoolClient } from "pg";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  ConventionPoleEmploiUserAdvisorEntityOpen,
  conventionPoleEmploiUserAdvisorEntityOpenSchema,
} from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import { ConventionPoleEmploiAdvisorRepository } from "../../../domain/peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { PeExternalId } from "../../../domain/peConnect/port/PeConnectGateway";
import {
  NotFoundError,
  validateAndParseZodSchema,
} from "../../primary/helpers/httpErrors";

export class PgConventionPoleEmploiAdvisorRepository
  implements ConventionPoleEmploiAdvisorRepository
{
  constructor(private client: PoolClient) {}

  public async associateConventionAndUserAdvisor(
    _immersionApplicationId: ImmersionApplicationId,
    _peExternalId: PeExternalId,
  ): Promise<void> {
    //const entity: ConventionPoleEmploiUserAdvisorEntityOpen = await this.getAlreadyOpenIfExist(peExternalId);
  }

  private async getAlreadyOpenIfExist(
    peExternalId: PeExternalId,
  ): Promise<ConventionPoleEmploiUserAdvisorEntityOpen> {
    const pgResult = await this.client.query(
      `SELECT *
       FROM partners_pe_connect
       WHERE user_pe_external_id = $1 
       AND convention_id IS NULL`,
      [peExternalId],
    );

    if (!pgResult.rows[0])
      throw new NotFoundError(
        "There is no open pole emploi advisor entity linked to this user peExternalId",
      );

    return validateAndParseZodSchema(
      conventionPoleEmploiUserAdvisorEntityOpenSchema,
      pgResult.rows[0],
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async openSlotForNextConvention(
    conventionPoleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntityOpen,
  ): Promise<void> {
    const beurk: ConventionPoleEmploiUserAdvisorEntityOpen | null = null;
    try {
      await this.getAlreadyOpenIfExist(
        conventionPoleEmploiUserAdvisorEntity.userPeExternalId,
      );
      return;
    } catch (error: any) {
      if (beurk != null) return;
      if (!(error instanceof NotFoundError)) throw error;

      const { id, userPeExternalId, firstName, lastName, email, type } =
        conventionPoleEmploiUserAdvisorEntity;

      const query = `INSERT INTO partners_pe_connect(
      id, user_pe_external_id, firstname, lastname, email, type
    ) VALUES($1, $2, $3, $4, $5, $6)`;

      const values = [id, userPeExternalId, firstName, lastName, email, type];

      await this.client.query(query, values);
    }
  }
}

/*
type MappedFields = Record<
  keyof DBConventionPoleEmploiUserAdvisorOpenFields,
  { field: keyof ConventionPoleEmploiUserAdvisorEntityOpen; value: string }
>;
*/

/*const generateRawQuery = (partnersPeConnectFields: MappedFields): string => {
  const tableName = "partners_pe_connect";
  const targetColumnsString: string = dbMappedFieldsNames(
    tableName,
    keys(partnersPeConnectFields),
  );
  const valuesArgumentMapString: string = keys(partnersPeConnectFields)
    .map((_, index) => `$${index}`)
    .join(", ");

  return `INSERT INTO ${targetColumnsString}
         VALUES(${valuesArgumentMapString})`;
};

// Proposition 1 (protégés par les types)
/!* const partnersPeConnectFields: MappedFields = entityToMappedFields(
   conventionPoleEmploiUserAdvisorEntity,
 );
 const rawQuery = generateRawQuery(partnersPeConnectFields);
 await this.client.query(
   rawQuery,
   values(partnersPeConnectFields).map((v) => v.value),
 );
*!/

const entityToMappedFields = (
  conventionPoleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntityOpen,
): Record<
  keyof DBConventionPoleEmploiUserAdvisorOpenFields,
  { field: keyof ConventionPoleEmploiUserAdvisorEntityOpen; value: string }
> => ({
  id: { field: "id", value: conventionPoleEmploiUserAdvisorEntity.id },
  user_pe_external_id: {
    field: "userPeExternalId",
    value: conventionPoleEmploiUserAdvisorEntity.userPeExternalId,
  },
  firstname: {
    field: "firstName",
    value: conventionPoleEmploiUserAdvisorEntity.firstName,
  },
  lastname: {
    field: "lastName",
    value: conventionPoleEmploiUserAdvisorEntity.lastName,
  },
  email: { field: "email", value: conventionPoleEmploiUserAdvisorEntity.email },
});

const dbMappedFieldsNames = (
  tableName: string,
  dbColumnsNames: string[],
): string => `${tableName}(${dbColumnsNames.join(", ")})`;

type DBConventionPoleEmploiUserAdvisorOpenFields = {
  id: { type: "uuid"; primaryKey: true };
  user_pe_external_id: { type: "uuid"; notNull: true };
  firstname: { type: "varchar(255)"; notNull: true };
  lastname: { type: "varchar(255)"; notNull: true };
  email: { type: "varchar(255)"; notNull: true };
};

type DBConventionPoleEmploiUserAdvisorCloseFields =
  DBConventionPoleEmploiUserAdvisorOpenFields & {
    convention_id: { type: "uuid" };
};*/

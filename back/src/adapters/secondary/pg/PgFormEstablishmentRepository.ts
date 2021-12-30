import { PoolClient } from "pg";
import { FormEstablishmentRepository } from "../../../domain/immersionOffer/ports/FormEstablishmentRepository";
import {
  FormEstablishmentDto,
  FormEstablishmentId,
} from "../../../shared/FormEstablishmentDto";

export class PgFormEstablishmentRepository
  implements FormEstablishmentRepository
{
  constructor(private client: PoolClient) {}

  public async getAll(): Promise<FormEstablishmentDto[]> {
    const pgResult = await this.client.query(
      "SELECT * FROM form_establishments",
    );
    return pgResult.rows.map((formEstablishment) =>
      this.pgToEntity(formEstablishment),
    );
  }

  public async getById(
    establishmentId: FormEstablishmentId,
  ): Promise<FormEstablishmentDto | undefined> {
    const pgResult = await this.client.query(
      `SELECT * FROM form_establishments
      WHERE id = $1`,
      [establishmentId],
    );

    const formEstablishment = pgResult.rows[0];
    if (!formEstablishment) return;

    return this.pgToEntity(formEstablishment);
  }

  public async save(
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<FormEstablishmentId | undefined> {
    // prettier-ignore
    const { id, siret, businessName, businessNameCustomized, businessAddress, isEngagedEnterprise, naf, professions, businessContacts, preferredContactMethods } =
      formEstablishmentDto

    const query = `INSERT INTO form_establishments(
        id, siret, business_name, business_Name_Customized, business_address, is_engaged_enterprise ,naf, professions, business_contacts, preferred_contact_methods
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

    // prettier-ignore
    await this.client.query(query, [id, siret, businessName, businessNameCustomized, businessAddress, isEngagedEnterprise ,naf, JSON.stringify(professions), JSON.stringify(businessContacts), JSON.stringify(preferredContactMethods)]);
    return formEstablishmentDto.id;
  }

  pgToEntity(params: Record<any, any>): FormEstablishmentDto {
    return {
      id: params.id,
      siret: params.siret,
      businessName: params.business_name,
      businessNameCustomized: params.business_name_customized,
      businessAddress: params.business_address,
      isEngagedEnterprise: params.is_engaged_enterprise,
      naf: params.naf,
      professions: params.professions,
      businessContacts: params.business_contacts,
      preferredContactMethods: params.preferred_contact_methods,
    };
  }
}

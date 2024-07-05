import { SiretDto } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";

import {
  EstablishmentMarketingContactEntity,
  EstablishmentMarketingRepository,
} from "../ports/EstablishmentMarketingRepository";

export class PgEstablishmentMarketingRepository
  implements EstablishmentMarketingRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentMarketingContactEntity | undefined> {
    const establishmentMarketingContact = await this.transaction
      .selectFrom("marketing_establishment_contacts")
      .select(["siret", "email", "contact_history"])
      .where("siret", "=", siret)
      .executeTakeFirst();

    return (
      establishmentMarketingContact && {
        contactEmail: establishmentMarketingContact.email,
        siret: establishmentMarketingContact.siret,
        emailContactHistory: establishmentMarketingContact.contact_history.map(
          ({ createdAt, ...rest }) => ({
            ...rest,
            createdAt: new Date(createdAt),
          }),
        ),
      }
    );
  }

  public async delete(siret: SiretDto): Promise<void> {
    await this.transaction
      .deleteFrom("marketing_establishment_contacts")
      .where("siret", "=", siret)
      .execute();
  }

  public async save({
    contactEmail,
    emailContactHistory,
    siret,
  }: EstablishmentMarketingContactEntity): Promise<void> {
    const values = {
      contact_history: JSON.stringify(emailContactHistory),
      email: contactEmail,
      siret,
    };
    await this.transaction
      .insertInto("marketing_establishment_contacts")
      .values(values)
      .onConflict((oc) => oc.column("siret").doUpdateSet(values))
      .execute();
  }
}

import { Pool } from "pg";
import { expectToEqual } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { MarketingContact } from "../entities/MarketingContact";
import { EstablishmentMarketingContactEntity } from "../ports/EstablishmentMarketingRepository";
import { PgEstablishmentMarketingRepository } from "./PgEstablishmentMarketingRepository";

describe("PgAgencyRepository", () => {
  let pool: Pool;
  let establishmentMarketingRepository: PgEstablishmentMarketingRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("marketing_establishment_contacts").execute();
    establishmentMarketingRepository = new PgEstablishmentMarketingRepository(
      makeKyselyDb(pool),
    );
  });

  it("getBySiret & save add/update & delete", async () => {
    const establishmentMarketingContact: EstablishmentMarketingContactEntity = {
      contactEmail: "jean-bidule@gmail.com",
      siret: "11112222333344",
      emailContactHistory: [
        {
          email: "jean-bidule@gmail.com",
          firstName: "Jean",
          lastName: "Bidule",
          createdAt: new Date(),
        },
      ],
    };

    expect(
      await establishmentMarketingRepository.getBySiret(
        establishmentMarketingContact.siret,
      ),
    ).toBeUndefined();

    await establishmentMarketingRepository.save(establishmentMarketingContact);

    expectToEqual(
      await establishmentMarketingRepository.getBySiret(
        establishmentMarketingContact.siret,
      ),
      establishmentMarketingContact,
    );

    const newContact: MarketingContact = {
      createdAt: new Date(),
      email: "other@mail.com",
      firstName: "Charles",
      lastName: "Maltais",
    };

    const updatedEstablishmentMarketingContact: EstablishmentMarketingContactEntity =
      {
        contactEmail: newContact.email,
        emailContactHistory: [
          newContact,
          ...establishmentMarketingContact.emailContactHistory,
        ],
        siret: establishmentMarketingContact.siret,
      };

    await establishmentMarketingRepository.save(
      updatedEstablishmentMarketingContact,
    );

    expectToEqual(
      await establishmentMarketingRepository.getBySiret(
        updatedEstablishmentMarketingContact.siret,
      ),
      updatedEstablishmentMarketingContact,
    );

    await establishmentMarketingRepository.delete(
      updatedEstablishmentMarketingContact.siret,
    );

    expectToEqual(
      await establishmentMarketingRepository.getBySiret(
        updatedEstablishmentMarketingContact.siret,
      ),
      undefined,
    );
  });
});

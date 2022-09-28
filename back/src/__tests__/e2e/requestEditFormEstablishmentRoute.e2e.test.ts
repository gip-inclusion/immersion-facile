import { addHours } from "date-fns";
import { EstablishmentJwtPayload } from "shared";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { InMemoryUnitOfWork } from "../../adapters/primary/config/uowConfig";
import { DomainEvent } from "../../domain/core/eventBus/events";
import { requestEmailToUpdateFormRoute } from "shared";

describe("Route to generate an establishment edition link", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, inMemoryUow } = await buildTestApp());
    inMemoryUow.establishmentAggregateRepository.getEstablishmentAggregateBySiret =
      //eslint-disable-next-line @typescript-eslint/require-await
      async () =>
        new EstablishmentAggregateBuilder()
          .withContact(
            new ContactEntityV2Builder().withEmail("erik@gmail.com").build(),
          )
          .build();
  });
  it("Returns 400 with an error message if previous edit link for this siret has not yet expired", async () => {
    // Prepare
    const now = new Date();
    const lastPayload: EstablishmentJwtPayload = {
      siret: "11111111111111",
      iat: now.getTime(),
      exp: addHours(now, 24).getTime(),
      version: 1,
    };
    await inMemoryUow.outboxRepository.save({
      topic: "FormEstablishmentEditLinkSent",
      payload: lastPayload,
    } as DomainEvent);

    // Act and assert
    await request
      .post(`/${requestEmailToUpdateFormRoute}/11111111111111`)
      .expect(400, {
        errors: `Un email a déjà été envoyé au contact référent de l'établissement le ${new Date(
          lastPayload.iat,
        ).toLocaleDateString("fr-FR")}`,
      });
  });

  it("Returns 200  if an edit link for this siret is still valid", async () => {
    await request
      .post(`/${requestEmailToUpdateFormRoute}/11111111111111`)
      .expect(200, '{"success":true}');
  });
});

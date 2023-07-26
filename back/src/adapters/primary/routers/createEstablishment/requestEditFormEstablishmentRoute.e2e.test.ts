import { SuperTest, Test } from "supertest";
import { requestEmailToUpdateFormRoute } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

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
            new ContactEntityBuilder().withEmail("erik@gmail.com").build(),
          )
          .build();
  });

  it("Returns 400 with an error message if previous edit link for this siret has not yet expired", async () => {
    // Prepare
    // first query of modification link
    await request.post(`/${requestEmailToUpdateFormRoute}/11111111111111`);

    // second query soon after which should fail
    const response = await request.post(
      `/${requestEmailToUpdateFormRoute}/11111111111111`,
    );

    expect(response.body.errors).toContain(
      "Un email a déjà été envoyé au contact référent de l'établissement",
    );
    expect(response.status).toBe(400);
  });

  it("Returns 200  if an edit link for this siret is still valid", async () => {
    await request
      .post(`/${requestEmailToUpdateFormRoute}/11111111111111`)
      .expect(200);
  });
});

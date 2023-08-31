import { SuperTest, Test } from "supertest";
import {
  currentJwtVersions,
  establishmentTargets,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import {
  GenerateBackOfficeJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../../../domain/auth/jwt";
import { establishmentNotFoundErrorMessage } from "../../../../domain/offer/ports/EstablishmentAggregateRepository";
import { formEstablishmentNotFoundErrorMessage } from "../../../../domain/offer/ports/FormEstablishmentRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe(`${establishmentTargets.deleteEstablishment.method} ${establishmentTargets.deleteEstablishment.url}`, () => {
  const establishmentAggregate = new EstablishmentAggregateBuilder().build();
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(establishmentAggregate.establishment.siret)
    .build();
  const deleteUrlWithSiret =
    establishmentTargets.deleteEstablishment.url.replace(
      ":siret",
      establishmentAggregate.establishment.siret,
    );

  let request: SuperTest<Test>;
  let uow: InMemoryUnitOfWork;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;

  beforeEach(async () => {
    ({
      request,
      inMemoryUow: uow,
      generateBackOfficeJwt,
      generateEditEstablishmentJwt,
    } = await buildTestApp());
  });

  it("204 - Establishment Aggregate & Form deleted with back office JWT", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];
    uow.formEstablishmentRepository.setFormEstablishments([formEstablishment]);

    const response = await request
      .delete(deleteUrlWithSiret)
      .set(
        "Authorization",
        generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
        }),
      )
      .send();

    expectToEqual(response.body, {});
    expectToEqual(response.status, 204);
    expectToEqual(
      uow.establishmentAggregateRepository.establishmentAggregates,
      [],
    );
    expectToEqual(await uow.formEstablishmentRepository.getAll(), []);
  });

  it("401 - Unauthenticated", async () => {
    const response = await request.delete(deleteUrlWithSiret).send();

    expectToEqual(response.body, {
      error: "forbidden: unauthenticated",
    });
    expectToEqual(response.status, 401);
  });

  it("403 - Jwt expired", async () => {
    const response = await request
      .delete(deleteUrlWithSiret)
      .set(
        "Authorization",
        generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
          exp: Math.round((new Date().getTime() - 48 * 3600 * 1000) / 1000),
        }),
      )
      .send();

    expectToEqual(response.body, {
      message: "Le lien magique est périmé",
      needsNewMagicLink: true,
    });
    expectToEqual(response.status, 403);
  });

  it("403 - Access refused with edit establishment JWT", async () => {
    const response = await request
      .delete(deleteUrlWithSiret)
      .set(
        "Authorization",
        generateEditEstablishmentJwt({
          siret: establishmentAggregate.establishment.siret,
          version: currentJwtVersions.establishment,
        }),
      )
      .send();

    expectToEqual(response.body, {
      errors: "Accès refusé",
    });
    expectToEqual(response.status, 403);
  });

  it("404 - Establishment Aggregate not found", async () => {
    const response = await request
      .delete(deleteUrlWithSiret)
      .set(
        "Authorization",
        generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
        }),
      )
      .send();

    expectToEqual(response.body, {
      errors: establishmentNotFoundErrorMessage(
        establishmentAggregate.establishment.siret,
      ),
    });
    expectToEqual(response.status, 404);
  });

  it("404 - Establishment Form not found", async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];

    const response = await request
      .delete(deleteUrlWithSiret)
      .set(
        "Authorization",
        generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
        }),
      )
      .send();

    expectToEqual(response.body, {
      errors: formEstablishmentNotFoundErrorMessage(
        establishmentAggregate.establishment.siret,
      ),
    });
    expectToEqual(response.status, 404);
  });
});

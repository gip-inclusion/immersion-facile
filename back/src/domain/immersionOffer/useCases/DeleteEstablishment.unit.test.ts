import {
  BackOfficeJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DeleteEstablishment } from "./DeleteEstablishment";

describe("Delete Establishment", () => {
  const establishmentAggregate = new EstablishmentAggregateBuilder().build();
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(establishmentAggregate.establishment.siret)
    .build();
  const backofficeJwtPayload: BackOfficeJwtPayload = {
    role: "backOffice",
    sub: "admin",
    exp: 2,
    iat: 1,
    version: 1,
  };
  let deleteEstablishment: DeleteEstablishment;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    deleteEstablishment = new DeleteEstablishment(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator: new TestUuidGenerator(),
      }),
    );
  });

  describe("Wrong paths", () => {
    it("Throws forbidden error on missing backoffice jwt", async () => {
      await expectPromiseToFailWithError(
        deleteEstablishment.execute({
          siret: establishmentAggregate.establishment.siret,
        }),
        new ForbiddenError("Accès refusé"),
      );
    });

    it("Throws not found error on missing establishment aggregate", async () => {
      await expectPromiseToFailWithError(
        deleteEstablishment.execute(
          {
            siret: establishmentAggregate.establishment.siret,
          },
          backofficeJwtPayload,
        ),
        new NotFoundError(
          `Establishment with siret ${establishmentAggregate.establishment.siret} not found`,
        ),
      );
    });

    it("Throws not found error on missing form establishment", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      await expectPromiseToFailWithError(
        deleteEstablishment.execute(
          {
            siret: formEstablishment.siret,
          },
          backofficeJwtPayload,
        ),
        new NotFoundError(
          `Establishment form with siret ${formEstablishment.siret} not found`,
        ),
      );
    });
  });

  describe("Right paths", () => {
    it("Establishment aggregate and form establishment are deleted", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      uow.formEstablishmentRepository.setFormEstablishments([
        formEstablishment,
      ]);

      await deleteEstablishment.execute(
        {
          siret: establishmentAggregate.establishment.siret,
        },
        backofficeJwtPayload,
      );

      expectToEqual(
        uow.establishmentAggregateRepository.establishmentAggregates,
        [],
      );
      expectToEqual(await uow.formEstablishmentRepository.getAll(), []);
    });
  });
});

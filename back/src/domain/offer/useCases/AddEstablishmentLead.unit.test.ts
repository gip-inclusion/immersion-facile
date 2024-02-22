import subDays from "date-fns/subDays";
import {
  ConventionDto,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { EstablishmentAggregateBuilder } from "../../../adapters/secondary/offer/EstablishmentBuilders";
import { InMemoryEstablishmentLeadRepository } from "../../../adapters/secondary/offer/InMemoryEstablishmentLeadRepository";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { AddEstablishmentLead } from "./AddEstablishmentLead";

describe("Add EstablishmentLead", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let addEstablishmentLead: AddEstablishmentLead;
  let establishmentLeadRepository: InMemoryEstablishmentLeadRepository;

  beforeEach(() => {
    uow = createInMemoryUow();

    timeGateway = new CustomTimeGateway();
    addEstablishmentLead = new AddEstablishmentLead(
      new InMemoryUowPerformer(uow),
      timeGateway,
    );
    establishmentLeadRepository = uow.establishmentLeadRepository;
  });

  it("do not add lead if convention is not ACCEPTED_BY_VALIDATOR", async () => {
    const convention: ConventionDto = new ConventionDtoBuilder()
      .withStatus("IN_REVIEW")
      .build();

    await expectPromiseToFailWithError(
      addEstablishmentLead.execute({ convention }),
      new BadRequestError(
        `La convention ${convention.id} n'est pas validée. Son status est : ${convention.status}`,
      ),
    );
  });

  it("do nothing if establishmentLead already exists", async () => {
    const convention: ConventionDto = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();
    const siret = convention.siret;

    const alreadySavedLead: EstablishmentLead = {
      siret: convention.siret,
      lastEventKind: "reminder-sent",
      events: [
        {
          conventionId: convention.id,
          kind: "to-be-reminded",
          occurredAt: subDays(new Date(), 2),
        },
        {
          kind: "reminder-sent",
          occurredAt: new Date(),
          notification: {
            id: "1234",
            kind: "email",
          },
        },
      ],
    };

    establishmentLeadRepository.establishmentLeads = [alreadySavedLead];

    await addEstablishmentLead.execute({ convention });

    expectToEqual(
      await establishmentLeadRepository.getBySiret(siret),
      alreadySavedLead,
    );
  });

  it("do nothing if establishment already exists", async () => {
    const convention: ConventionDto = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();
    const siret = convention.siret;

    const establishmentAggregate: EstablishmentAggregate =
      new EstablishmentAggregateBuilder().withEstablishmentSiret(siret).build();

    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );

    await addEstablishmentLead.execute({ convention });

    expectToEqual(
      await establishmentLeadRepository.getBySiret(siret),
      undefined,
    );
  });

  it("Add new establishment lead", async () => {
    const convention: ConventionDto = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();
    const siret = convention.siret;

    await addEstablishmentLead.execute({ convention });

    expectToEqual(await establishmentLeadRepository.getBySiret(siret), {
      siret,
      lastEventKind: "to-be-reminded",
      events: [
        {
          conventionId: convention.id,
          occurredAt: timeGateway.now(),
          kind: "to-be-reminded",
        },
      ],
    });
  });
});

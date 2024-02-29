import subDays from "date-fns/subDays";
import {
  ConventionDto,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryEstablishmentLeadRepository } from "../adapters/InMemoryEstablishmentLeadRepository";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
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

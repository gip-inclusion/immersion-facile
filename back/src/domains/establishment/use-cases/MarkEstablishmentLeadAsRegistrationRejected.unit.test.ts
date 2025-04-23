import { subDays } from "date-fns";
import {
  ConventionDtoBuilder,
  type ConventionJwtPayload,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import type { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { MarkEstablishmentLeadAsRegistrationRejected } from "./MarkEstablishmentLeadAsRegistrationRejected";

const convention = new ConventionDtoBuilder().build();

describe("MarkEstablishmentLeadAsRegistrationRejected", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: MarkEstablishmentLeadAsRegistrationRejected;
  let timeGateway: CustomTimeGateway;
  let conventionJwt: ConventionJwtPayload;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();

    usecase = new MarkEstablishmentLeadAsRegistrationRejected(
      new InMemoryUowPerformer(uow),
      timeGateway,
    );

    conventionJwt = createConventionMagicLinkPayload({
      id: convention.id,
      role: "establishment-representative",
      email: convention.signatories.establishmentRepresentative.email,
      now: timeGateway.now(),
    });
  });

  it("throw not found error when convention not found", async () => {
    await expectPromiseToFailWithError(
      usecase.execute(undefined, conventionJwt),
      errors.convention.notFound({ conventionId: convention.id }),
    );
  });

  it("throw not found error when establishment lead not found", async () => {
    uow.conventionRepository.setConventions([convention]);

    await expectPromiseToFailWithError(
      usecase.execute(undefined, conventionJwt),
      errors.establishmentLead.notFound({ siret: convention.siret }),
    );
  });

  it("update establishmentLead's kind", async () => {
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
          notification: { id: "my-fake-notification-id", kind: "email" },
        },
      ],
    };
    uow.conventionRepository.setConventions([convention]);
    uow.establishmentLeadRepository.establishmentLeads = [alreadySavedLead];

    await usecase.execute(undefined, conventionJwt);

    expectToEqual(uow.establishmentLeadRepository.establishmentLeads, [
      {
        ...alreadySavedLead,
        lastEventKind: "registration-refused",
        events: [
          ...alreadySavedLead.events,
          {
            kind: "registration-refused",
            occurredAt: timeGateway.now(),
          },
        ],
      },
    ]);
  });

  it("doesn't update establishmentLead's kind when last event king is already registration rejected", async () => {
    const alreadySavedLead: EstablishmentLead = {
      siret: convention.siret,
      lastEventKind: "registration-refused",
      events: [
        {
          conventionId: convention.id,
          kind: "to-be-reminded",
          occurredAt: subDays(new Date(), 2),
        },
        {
          kind: "reminder-sent",
          occurredAt: subDays(new Date(), 1),
          notification: { id: "my-fake-notification-id", kind: "email" },
        },
        {
          kind: "registration-refused",
          occurredAt: new Date(),
        },
      ],
    };

    uow.conventionRepository.setConventions([convention]);
    uow.establishmentLeadRepository.establishmentLeads = [alreadySavedLead];

    await usecase.execute(undefined, conventionJwt);

    expectToEqual(uow.establishmentLeadRepository.establishmentLeads, [
      {
        ...alreadySavedLead,
        lastEventKind: "registration-refused",
        events: [...alreadySavedLead.events],
      },
    ]);
  });
});

import { subDays } from "date-fns";
import {
  ConventionDto,
  ConventionDtoBuilder,
  FormEstablishmentDtoBuilder,
  expectToEqual,
} from "shared";
import { InMemoryEstablishmentLeadRepository } from "../../../adapters/secondary/offer/InMemoryEstablishmentLeadRepository";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { MarkEstablishmentLeadAsRegistrationAccepted } from "./MarkEstablishmentLeadAsRegistrationAccepted";

describe("UpdateEstablishmentLeadOnEstablishmentRegistered", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let updateEstablishmentLead: MarkEstablishmentLeadAsRegistrationAccepted;
  let establishmentLeadRepository: InMemoryEstablishmentLeadRepository;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();

    updateEstablishmentLead = new MarkEstablishmentLeadAsRegistrationAccepted(
      new InMemoryUowPerformer(uow),
      timeGateway,
    );
    establishmentLeadRepository = uow.establishmentLeadRepository;
  });

  it("do nothing when no establishment were found", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    await updateEstablishmentLead.execute({ formEstablishment });

    expectToEqual(
      await establishmentLeadRepository.getBySiret(formEstablishment.siret),
      undefined,
    );
  });

  it("update establishment lead status to 'registration-accepted'", async () => {
    const convention: ConventionDto = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();
    const alreadySavedLead: EstablishmentLead = {
      siret: convention.siret,
      lastEventKind: "reminder-sent",
      events: [
        {
          conventionId: convention.id,
          kind: "to-be-reminded",
          occurredAt: subDays(timeGateway.now(), 2),
        },
        {
          kind: "reminder-sent",
          occurredAt: subDays(timeGateway.now(), 1),
          notification: { id: "my-notification-id", kind: "email" },
        },
      ],
    };
    establishmentLeadRepository.establishmentLeads = [alreadySavedLead];
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(convention.siret)
      .build();

    await updateEstablishmentLead.execute({ formEstablishment });

    expectToEqual(
      await establishmentLeadRepository.getBySiret(formEstablishment.siret),

      {
        siret: convention.siret,
        lastEventKind: "registration-accepted",
        events: [
          {
            conventionId: convention.id,
            kind: "to-be-reminded",
            occurredAt: subDays(timeGateway.now(), 2),
          },
          {
            kind: "reminder-sent",
            occurredAt: subDays(timeGateway.now(), 1),
            notification: { id: "my-notification-id", kind: "email" },
          },
          {
            kind: "registration-accepted",
            occurredAt: timeGateway.now(),
          },
        ],
      },
    );
  });
});

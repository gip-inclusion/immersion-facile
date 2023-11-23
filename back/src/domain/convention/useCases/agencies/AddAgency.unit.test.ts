import {
  AgencyDto,
  CreateAgencyDto,
  expectPromiseToFail,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../core/eventBus/EventBus";
import { referedAgencyMissingMessage } from "../../ports/AgencyRepository";
import { AddAgency } from "./AddAgency";

describe("AddAgency use case", () => {
  const createParisMissionLocaleParams: CreateAgencyDto = {
    id: "some-id",
    address: {
      streetNumberAndAddress: "10 avenue des Champs Elysées",
      city: "Paris",
      departmentCode: "75",
      postcode: "75017",
    },
    counsellorEmails: ["counsellor@mail.com"],
    validatorEmails: ["validator@mail.com"],
    kind: "mission-locale",
    name: "Mission locale de Paris",
    position: { lat: 10, lon: 20 },
    questionnaireUrl: "www.myUrl.com",
    signature: "Super signature of the agency",
    logoUrl: "https://www.myUrl.com",
    agencySiret: "01234567891234",
    refersToAgencyId: undefined,
  };

  const createAgencyWithRefersToParams: CreateAgencyDto = {
    id: "another-id",
    address: {
      streetNumberAndAddress: "10bis avenue des Champs Elysées",
      city: "Paris",
      departmentCode: "75",
      postcode: "75017",
    },
    counsellorEmails: ["counsellor@mail.com"],
    validatorEmails: ["mail.should.not.be.applied@email.com"],
    kind: "mission-locale",
    name: "Mission locale de Paris Bis",
    position: { lat: 10, lon: 20 },
    signature: "Super signature of the agency bis",
    agencySiret: "01234567890000",
    refersToAgencyId: createParisMissionLocaleParams.id,
  };

  let uow: InMemoryUnitOfWork;
  let addAgency: AddAgency;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    uow = createInMemoryUow();
    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator: new TestUuidGenerator(),
    });
    addAgency = new AddAgency(new InMemoryUowPerformer(uow), createNewEvent);
  });

  describe("right paths", () => {
    it("save the agency in repo, with the default admin mail and the status to be reviewed", async () => {
      uow.agencyRepository.setAgencies([]);

      await addAgency.execute(createParisMissionLocaleParams);

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...createParisMissionLocaleParams,
          adminEmails: [],
          status: "needsReview",
          questionnaireUrl: createParisMissionLocaleParams.questionnaireUrl!,
        },
      ]);
    });

    it("sets an events to be dispatched with the added agency", async () => {
      await addAgency.execute(createParisMissionLocaleParams);

      expectToEqual(uow.outboxRepository.events, [
        createNewEvent({
          topic: "NewAgencyAdded",
          payload: {
            agency: {
              ...createParisMissionLocaleParams,
              questionnaireUrl:
                createParisMissionLocaleParams.questionnaireUrl!,
              adminEmails: [],
              status: "needsReview",
            },
          },
        }),
      ]);
    });

    it("uses default questionnaire url when none is provided", async () => {
      const poleEmploiParis: CreateAgencyDto = {
        ...createParisMissionLocaleParams,
        questionnaireUrl: "",
      };

      uow.agencyRepository.setAgencies([]);
      await addAgency.execute(poleEmploiParis);

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...poleEmploiParis,
          adminEmails: [],
          status: "needsReview",
          questionnaireUrl: "",
        },
      ]);
    });

    it("agengy with refers to should have validator emails from referral agency", async () => {
      const miloAgency: AgencyDto = {
        ...createParisMissionLocaleParams,
        adminEmails: [],
        status: "needsReview",
        questionnaireUrl: createParisMissionLocaleParams.questionnaireUrl!,
      };
      uow.agencyRepository.setAgencies([miloAgency]);

      await addAgency.execute(createAgencyWithRefersToParams);

      expectToEqual(uow.agencyRepository.agencies, [
        miloAgency,
        {
          ...createAgencyWithRefersToParams,
          validatorEmails: miloAgency.validatorEmails,
          adminEmails: [],
          status: "needsReview",
          questionnaireUrl: "",
        },
      ]);
    });
  });

  describe("wrong paths", () => {
    it("Fails to add agency if address components are empty", async () => {
      const agencyWithBadAddress: CreateAgencyDto = {
        ...createParisMissionLocaleParams,
        address: {
          streetNumberAndAddress: "",
          postcode: "",
          city: "",
          departmentCode: "",
        },
      };

      await expectPromiseToFail(addAgency.execute(agencyWithBadAddress));
    });

    it("Fails to add agency if geo components are 0,0", async () => {
      const agencyWithBadPosition: CreateAgencyDto = {
        ...createParisMissionLocaleParams,
        position: {
          lat: 0,
          lon: 0,
        },
      };

      await expectPromiseToFail(addAgency.execute(agencyWithBadPosition));
    });

    it("fails when refered agency is missing", async () => {
      uow.agencyRepository.setAgencies([]);

      await expectPromiseToFailWithError(
        addAgency.execute(createAgencyWithRefersToParams),
        new NotFoundError(
          referedAgencyMissingMessage(createParisMissionLocaleParams.id),
        ),
      );

      expectToEqual(uow.agencyRepository.agencies, []);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});

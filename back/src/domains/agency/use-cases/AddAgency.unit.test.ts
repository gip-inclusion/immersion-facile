import {
  AgencyDto,
  AgencyDtoBuilder,
  CreateAgencyDto,
  InclusionConnectedUserBuilder,
  User,
  errors,
  expectArraysToMatch,
  expectPromiseToFail,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ConflictError } from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import {
  InMemorySiretGateway,
  TEST_OPEN_ESTABLISHMENT_1,
} from "../../core/sirene/adapters/InMemorySiretGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { AddAgency } from "./AddAgency";

describe("AddAgency use case", () => {
  const counsellor = new InclusionConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .buildUser();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();
  const createParisMissionLocaleParams: CreateAgencyDto = {
    id: "some-id",
    coveredDepartments: ["75"],
    address: {
      streetNumberAndAddress: "10 avenue des Champs Elysées",
      city: "Paris",
      departmentCode: "75",
      postcode: "75017",
    },
    counsellorEmails: [counsellor.email],
    validatorEmails: [validator.email],
    kind: "mission-locale",
    name: "Mission locale de Paris",
    position: { lat: 10, lon: 20 },
    questionnaireUrl: "https://www.my-test-Url.com",
    signature: "Super signature of the agency",
    logoUrl: "https://www.myUrl.com",
    agencySiret: TEST_OPEN_ESTABLISHMENT_1.siret,
    refersToAgencyId: null,
    refersToAgencyName: null,
  };

  const createAgencyWithRefersToParams: CreateAgencyDto = {
    id: "another-id",
    coveredDepartments: ["75"],
    address: {
      streetNumberAndAddress: "10bis avenue des Champs Elysées",
      city: "Paris",
      departmentCode: "75",
      postcode: "75017",
    },
    counsellorEmails: ["counsellor-from-agency-with-refers-to@mail.com"],
    validatorEmails: ["mail.should.not.be.applied@email.com"],
    kind: "mission-locale",
    name: "Mission locale de Paris Bis",
    position: { lat: 10, lon: 20 },
    signature: "Super signature of the agency bis",
    agencySiret: TEST_OPEN_ESTABLISHMENT_1.siret,
    refersToAgencyId: createParisMissionLocaleParams.id,
    refersToAgencyName: createParisMissionLocaleParams.name,
    questionnaireUrl: null,
    logoUrl: null,
  };
  const uuids = ["uuid1", "uuid2", "uuid3", "uuid4"];

  let uow: InMemoryUnitOfWork;
  let addAgency: AddAgency;
  let createNewEvent: CreateNewEvent;
  let siretGateway: InMemorySiretGateway;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();
    siretGateway = new InMemorySiretGateway();
    createNewEvent = makeCreateNewEvent({
      timeGateway: timeGateway,
      uuidGenerator: uuidGenerator,
    });
    addAgency = new AddAgency(
      new InMemoryUowPerformer(uow),
      createNewEvent,
      siretGateway,
      timeGateway,
      uuidGenerator,
    );
    uuidGenerator.setNextUuids([...uuids]);
  });

  describe("right paths", () => {
    it("save the agency in repo, with the default admin mail and the status to be reviewed", async () => {
      uow.agencyRepository.agencies = [];
      uow.userRepository.users = [];

      await addAgency.execute(createParisMissionLocaleParams);

      const newValidator: User = {
        id: uuids[0],
        email: createParisMissionLocaleParams.validatorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: "Non fourni",
        lastName: "Non fourni",
        externalId: null,
      };
      const newCounsellor: User = {
        id: uuids[1],
        email: createParisMissionLocaleParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: "Non fourni",
        lastName: "Non fourni",
        externalId: null,
      };

      expectToEqual(uow.userRepository.users, [newValidator, newCounsellor]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(
          {
            ...createParisMissionLocaleParams,
            status: "needsReview",
            questionnaireUrl: createParisMissionLocaleParams.questionnaireUrl,
            rejectionJustification: null,
            codeSafir: null,
            counsellorEmails: [],
            validatorEmails: [],
          },
          {
            [newValidator.id]: {
              isNotifiedByEmail: false,
              roles: ["validator"],
            },
            [newCounsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
          },
        ),
      ]);
    });

    it("do not create other users if they exist with same email but apply rights on new agency for them", async () => {
      uow.agencyRepository.agencies = [];
      uow.userRepository.users = [counsellor, validator];

      await addAgency.execute(createParisMissionLocaleParams);

      expectToEqual(uow.userRepository.users, [counsellor, validator]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(
          {
            ...createParisMissionLocaleParams,
            status: "needsReview",
            questionnaireUrl: createParisMissionLocaleParams.questionnaireUrl,
            rejectionJustification: null,
            codeSafir: null,
            counsellorEmails: [],
            validatorEmails: [],
          },
          {
            [validator.id]: {
              isNotifiedByEmail: false,
              roles: ["validator"],
            },
            [counsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
          },
        ),
      ]);
    });

    it("sets an events to be dispatched with the added agency", async () => {
      await addAgency.execute(createParisMissionLocaleParams);

      expectArraysToMatch(uow.outboxRepository.events, [
        {
          id: uuids[2],
          topic: "NewAgencyAdded",
          payload: {
            agencyId: createParisMissionLocaleParams.id,
            triggeredBy: null,
          },
        },
      ]);
    });

    it("uses default questionnaire url when none is provided", async () => {
      const poleEmploiParis: CreateAgencyDto = {
        ...createParisMissionLocaleParams,
      };

      uow.agencyRepository.agencies = [];
      uow.userRepository.users = [];

      await addAgency.execute(poleEmploiParis);

      const newValidator: User = {
        id: uuids[0],
        email: createParisMissionLocaleParams.validatorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: "Non fourni",
        lastName: "Non fourni",
        externalId: null,
      };
      const newCounsellor: User = {
        id: uuids[1],
        email: createParisMissionLocaleParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: "Non fourni",
        lastName: "Non fourni",
        externalId: null,
      };
      expectToEqual(uow.userRepository.users, [newValidator, newCounsellor]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(
          {
            ...poleEmploiParis,
            counsellorEmails: [],
            validatorEmails: [],
            status: "needsReview",
            codeSafir: null,
            rejectionJustification: null,
          },
          {
            [newValidator.id]: {
              isNotifiedByEmail: false,
              roles: ["validator"],
            },
            [newCounsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
          },
        ),
      ]);
    });

    it("agengy with refers to should have validator emails from referral agency", async () => {
      const existingMiloAgency: AgencyDto = {
        ...createParisMissionLocaleParams,
        counsellorEmails: [],
        validatorEmails: [],
        status: "needsReview",
        questionnaireUrl: createParisMissionLocaleParams.questionnaireUrl,
        codeSafir: null,
        rejectionJustification: null,
      };
      uow.userRepository.users = [counsellor, validator];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(existingMiloAgency, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
          [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        }),
      ];

      await addAgency.execute(createAgencyWithRefersToParams);

      const newCounsellor: User = {
        id: uuids[0],
        email: createAgencyWithRefersToParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: "Non fourni",
        lastName: "Non fourni",
        externalId: null,
      };

      expectToEqual(uow.userRepository.users, [
        counsellor,
        validator,
        newCounsellor,
      ]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(
          { ...existingMiloAgency, counsellorEmails: [], validatorEmails: [] },
          {
            [counsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          },
        ),
        toAgencyWithRights(
          {
            ...createAgencyWithRefersToParams,
            status: "needsReview",
            codeSafir: null,
            rejectionJustification: null,
            counsellorEmails: [],
            validatorEmails: [],
          },
          {
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
            [newCounsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
          },
        ),
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
      uow.agencyRepository.agencies = [];

      await expectPromiseToFailWithError(
        addAgency.execute(createAgencyWithRefersToParams),
        errors.agency.notFound({ agencyId: createParisMissionLocaleParams.id }),
      );
    });

    it("fails to create if the has the same address and kind than an existing one", async () => {
      const existingAgency = new AgencyDtoBuilder().build();
      const newAgency = new AgencyDtoBuilder()
        .withId("agency-to-create-id")
        .withStatus("needsReview")
        .withAddress(existingAgency.address)
        .withKind(existingAgency.kind)
        .withAgencySiret("11110000111100")
        .build();

      uow.agencyRepository.agencies = [toAgencyWithRights(existingAgency)];

      await expectPromiseToFailWithError(
        addAgency.execute({ ...newAgency, validatorEmails: ["mail@mail.com"] }),
        new ConflictError(
          "Une autre agence du même type existe avec la même adresse",
        ),
      );
    });

    it("fails to create if agency siret is not valid", async () => {
      const newAgency = new AgencyDtoBuilder()
        .withId("agency-to-create-id")
        .withStatus("needsReview")
        .withAgencySiret("11110000111100")
        .build();

      await expectPromiseToFailWithError(
        addAgency.execute({ ...newAgency, validatorEmails: ["mail@mail.com"] }),
        errors.agency.invalidSiret({ siret: newAgency.agencySiret }),
      );
    });
  });
});

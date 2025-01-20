import {
  AgencyDto,
  AgencyDtoBuilder,
  BadRequestError,
  CreateAgencyDto,
  InclusionConnectedUserBuilder,
  User,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ConflictError } from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { emptyName } from "../../core/authentication/inclusion-connect/entities/user.helper";
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
    questionnaireUrl: "https://www.my-test-url.com",
    signature: "Super signature of the agency",
    logoUrl: "https://www.my-url.com",
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
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uuidGenerator = new TestUuidGenerator();
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
    it("add user with both validator and counsellor rights if the user is in validatorEmails and counsellorEmails", async () => {
      uow.agencyRepository.agencies = [];
      uow.userRepository.users = [];

      const newValidator: User = {
        id: uuids[0],
        email: createParisMissionLocaleParams.validatorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
        externalId: null,
      };
      const newCounsellor: User = {
        id: uuids[1],
        email: createParisMissionLocaleParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
        externalId: null,
      };

      await addAgency.execute({
        ...createParisMissionLocaleParams,
        validatorEmails: [newValidator.email],
        counsellorEmails: [newValidator.email, newCounsellor.email],
      });

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
              isNotifiedByEmail: true,
              roles: ["validator", "counsellor"],
            },
            [newCounsellor.id]: {
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          },
        ),
      ]);
    });

    it("the agency is saved in the agency in repo, with the status to be reviewed and missing users by email are created and have notified rights", async () => {
      uow.agencyRepository.agencies = [];
      uow.userRepository.users = [];

      await addAgency.execute(createParisMissionLocaleParams);

      const newValidator: User = {
        id: uuids[0],
        email: createParisMissionLocaleParams.validatorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
        externalId: null,
      };
      const newCounsellor: User = {
        id: uuids[1],
        email: createParisMissionLocaleParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
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
              isNotifiedByEmail: true,
              roles: ["validator"],
            },
            [newCounsellor.id]: {
              isNotifiedByEmail: true,
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
              isNotifiedByEmail: true,
              roles: ["validator"],
            },
            [counsellor.id]: {
              isNotifiedByEmail: true,
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

    it("uses no questionnaire url when none is provided", async () => {
      const agencyWithoutQuestionnaire: CreateAgencyDto = {
        ...createParisMissionLocaleParams,
        questionnaireUrl: null,
      };

      uow.agencyRepository.agencies = [];
      uow.userRepository.users = [];

      await addAgency.execute(agencyWithoutQuestionnaire);

      const newValidator: User = {
        id: uuids[0],
        email: createParisMissionLocaleParams.validatorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
        externalId: null,
      };
      const newCounsellor: User = {
        id: uuids[1],
        email: createParisMissionLocaleParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
        externalId: null,
      };
      expectToEqual(uow.userRepository.users, [newValidator, newCounsellor]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(
          {
            ...agencyWithoutQuestionnaire,
            counsellorEmails: [],
            validatorEmails: [],
            status: "needsReview",
            codeSafir: null,
            rejectionJustification: null,
            questionnaireUrl: null,
          },
          {
            [newValidator.id]: {
              isNotifiedByEmail: true,
              roles: ["validator"],
            },
            [newCounsellor.id]: {
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          },
        ),
      ]);
    });

    it("agency with refers to should have validator emails from referral agency, respecting the notification option", async () => {
      const validator2 = new InclusionConnectedUserBuilder()
        .withId("validator-2")
        .withEmail("validator2@mail.com")
        .buildUser();
      const existingMiloAgency: AgencyDto = {
        ...createParisMissionLocaleParams,
        counsellorEmails: [],
        validatorEmails: [],
        status: "needsReview",
        questionnaireUrl: createParisMissionLocaleParams.questionnaireUrl,
        codeSafir: null,
        rejectionJustification: null,
      };
      uow.userRepository.users = [counsellor, validator, validator2];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(existingMiloAgency, {
          [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          [validator2.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        }),
      ];

      await addAgency.execute(createAgencyWithRefersToParams);

      const newCounsellor: User = {
        id: uuids[0],
        email: createAgencyWithRefersToParams.counsellorEmails[0],
        createdAt: timeGateway.now().toISOString(),
        firstName: emptyName,
        lastName: emptyName,
        externalId: null,
      };

      expectToEqual(uow.userRepository.users, [
        counsellor,
        validator,
        validator2,
        newCounsellor,
      ]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(
          { ...existingMiloAgency, counsellorEmails: [], validatorEmails: [] },
          {
            [counsellor.id]: {
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
            [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
            [validator2.id]: { isNotifiedByEmail: false, roles: ["validator"] },
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
            [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
            [validator2.id]: { isNotifiedByEmail: false, roles: ["validator"] },
            [newCounsellor.id]: {
              isNotifiedByEmail: true,
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

      await expectPromiseToFailWithError(
        addAgency.execute(agencyWithBadAddress),
        new BadRequestError(
          "Schema validation failed. See issues for details.",
          [
            "address.postcode : Obligatoire",
            "address.departmentCode : Obligatoire",
            "address.city : Obligatoire",
          ],
        ),
      );
    });

    it("Fails to add agency if geo components are 0,0", async () => {
      const agencyWithBadPosition: CreateAgencyDto = {
        ...createParisMissionLocaleParams,
        position: {
          lat: 0,
          lon: 0,
        },
      };

      await expectPromiseToFailWithError(
        addAgency.execute(agencyWithBadPosition),
        new BadRequestError(
          "Schema validation failed. See issues for details.",
          [
            "position.lat : 0 est une latitude par défaut qui ne semble pas correcte",
            "position.lon : 0 est une longitude par défaut qui ne semble pas correcte",
          ],
        ),
      );
    });

    it("fails when referred agency is missing", async () => {
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

    it("fails to create if at least one validator email is not provided", async () => {
      const newAgency = new AgencyDtoBuilder()
        .withId("agency-to-create-id")
        .withStatus("needsReview")
        .withAgencySiret("11110000111100")
        .build();

      await expectPromiseToFailWithError(
        addAgency.execute({
          ...newAgency,
          validatorEmails: [],
          counsellorEmails: [],
        }),
        new BadRequestError(
          "Schema validation failed. See issues for details.",
          ["validatorEmails : Vous devez renseigner au moins un email"],
        ),
      );
    });
  });
});

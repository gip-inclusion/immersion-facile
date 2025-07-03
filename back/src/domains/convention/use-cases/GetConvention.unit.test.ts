import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  defaultProConnectInfos,
  errors,
  establishmentsRoles,
  expectPromiseToFailWithError,
  expectToEqual,
  type Role,
  type User,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeEmailHash } from "../../../utils/jwt";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../establishment/helpers/EstablishmentBuilders";
import { GetConvention } from "./GetConvention";

describe("Get Convention", () => {
  const uuidGenerator = new UuidV4Generator();
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.fr")
    .build();
  const validator = new ConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.fr")
    .build();
  const johnDoe: User = {
    id: "johndoe",
    email: "my-user@email.com",
    firstName: "John",
    lastName: "Doe",
    proConnect: defaultProConnectInfos,
    createdAt: new Date().toISOString(),
  };
  const establishmentRep: User = {
    id: "estabrep",
    email: "estabrep@mail.com",
    firstName: "John",
    lastName: "Doe",
    proConnect: defaultProConnectInfos,
    createdAt: new Date().toISOString(),
  };
  const tutor: User = {
    id: "my-tutor-user-id",
    email: "tutor@email.com",
    firstName: "John",
    lastName: "Doe",
    proConnect: defaultProConnectInfos,
    createdAt: new Date().toISOString(),
  };

  const backofficeAdminUser = new ConnectedUserBuilder()
    .withId(uuidGenerator.new())
    .withIsAdmin(true)
    .buildUser();

  const agency = new AgencyDtoBuilder().build();
  const convention = new ConventionDtoBuilder()
    .withId(uuidGenerator.new())
    .withAgencyId(agency.id)
    .withEstablishmentRepresentative({
      email: "estab-rep@email.com",
      firstName: "",
      lastName: "",
      phone: "",
      role: "establishment-representative",
    })
    .withBeneficiaryRepresentative({
      email: "benef-rep@email.com",
      firstName: "",
      lastName: "",
      phone: "",
      role: "beneficiary-representative",
    })
    .withBeneficiaryCurrentEmployer({
      email: "benef-rep@email.com",
      firstName: "",
      lastName: "",
      phone: "",
      businessAddress: "",
      businessName: "",
      businessSiret: "",
      job: "",
      role: "beneficiary-current-employer",
    })
    .withEstablishmentRepresentativeEmail(establishmentRep.email)
    .withAgencyReferent({ firstname: "Fredy", lastname: "L'ACCOMPAGNATEUR" })
    .build();
  const conventionWithEstablishmentTutor = new ConventionDtoBuilder()
    .withId(uuidGenerator.new())
    .withAgencyId(agency.id)
    .withEstablishmentTutor({
      email: tutor.email,
      firstName: "John",
      lastName: "Doe",
      role: "establishment-tutor",
      phone: "+33602010203",
      job: "Job",
    })
    .build();
  const establishmentWithSiret = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret(convention.siret)
    .withUserRights([
      {
        role: "establishment-admin",
        job: "",
        phone: "",
        userId: tutor.id,
      },
    ])
    .build();

  const ftAdvisorEmail = "ft-advisor@mail.fr";
  const ftConnectedConvention = new ConventionDtoBuilder(convention)
    .withId(uuidGenerator.new())
    .withFederatedIdentity({
      provider: "peConnect",
      token: "some-id",
      payload: {
        advisor: {
          email: ftAdvisorEmail,
          firstName: "john",
          lastName: "doe",
          type: "PLACEMENT",
        },
      },
    })
    .build();

  let getConvention: GetConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConvention = new GetConvention(new InMemoryUowPerformer(uow));

    uow.conventionRepository.setConventions([
      convention,
      conventionWithEstablishmentTutor,
      ftConnectedConvention,
    ]);
    uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
    uow.userRepository.users = [
      counsellor,
      validator,
      johnDoe,
      establishmentRep,
      tutor,
      backofficeAdminUser,
    ];
  });

  describe("Wrong paths", () => {
    describe("Forbidden error", () => {
      it("When no auth payload provided", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }),
          errors.user.noJwtProvided(),
        );
      });

      it("When the user don't have correct role on connected users neither has right on existing establishment with same siret in convention", async () => {
        uow.establishmentAggregateRepository.establishmentAggregates = [
          establishmentWithSiret,
        ];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [johnDoe.id]: { isNotifiedByEmail: false, roles: ["to-review"] },
          }),
        ];

        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            { userId: johnDoe.id },
          ),
          errors.convention.forbiddenMissingRights({
            conventionId: convention.id,
            userId: johnDoe.id,
          }),
        );
      });

      describe("with ConventionJwtPayload", () => {
        it("When convention id in jwt token does not match provided one", async () => {
          await expectPromiseToFailWithError(
            getConvention.execute(
              { conventionId: convention.id },
              {
                role: "establishment-representative",
                applicationId: "not-matching-convention-id",
                emailHash: "",
              },
            ),
            errors.convention.forbiddenMissingRights({
              conventionId: convention.id,
            }),
          );
        });

        it.each([
          "validator",
          "beneficiary",
          "counsellor",
          "validator",
          "establishment-representative",
          "establishment-tutor",
          "beneficiary-current-employer",
          "beneficiary-representative",
        ] satisfies Role[])(
          "When there is not email hash match from '%role' emails in convention or in agency",
          async (role) => {
            uow.agencyRepository.agencies = [
              toAgencyWithRights(agency, {
                [validator.id]: {
                  isNotifiedByEmail: false,
                  roles: ["validator"],
                },
                [counsellor.id]: {
                  isNotifiedByEmail: false,
                  roles: ["counsellor"],
                },
              }),
            ];

            await expectPromiseToFailWithError(
              getConvention.execute(
                { conventionId: convention.id },
                {
                  role,
                  emailHash: "thisHashDontMatch",
                  applicationId: convention.id,
                },
              ),
              errors.convention.forbiddenMissingRights({
                conventionId: convention.id,
              }),
            );
          },
        );

        it("when the user has ProConnect but not for the agency of this convention", async () => {
          const anotherAgency = new AgencyDtoBuilder(agency)
            .withId("another")
            .build();

          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency),
            toAgencyWithRights(anotherAgency, {
              [johnDoe.id]: { isNotifiedByEmail: false, roles: ["validator"] },
            }),
          ];

          await expectPromiseToFailWithError(
            getConvention.execute(
              { conventionId: convention.id },
              {
                role: "validator",
                emailHash: makeEmailHash(johnDoe.email),
                applicationId: convention.id,
              },
            ),
            errors.convention.forbiddenMissingRights({
              conventionId: convention.id,
            }),
          );
        });
      });
    });

    describe("Not found error", () => {
      it("When the Convention does not exist", async () => {
        uow.conventionRepository.setConventions([]);

        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            {
              role: "establishment-representative",
              applicationId: convention.id,
              emailHash: "",
            },
          ),
          errors.convention.notFound({ conventionId: convention.id }),
        );
      });

      it("When if user is missing", async () => {
        uow.userRepository.users = [];

        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            { userId: johnDoe.id },
          ),
          errors.user.notFound({ userId: johnDoe.id }),
        );
      });
    });
  });

  describe("Right paths", () => {
    describe("connected user", () => {
      it("that have agency rights", async () => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [johnDoe.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];

        expectToEqual(
          await getConvention.execute(
            { conventionId: convention.id },
            {
              userId: johnDoe.id,
            },
          ),
          {
            ...convention,
            agencyName: agency.name,
            agencyDepartment: agency.address.departmentCode,
            agencyKind: agency.kind,
            agencySiret: agency.agencySiret,
            agencyCounsellorEmails: [],
            agencyValidatorEmails: [johnDoe.email],
          },
        );
      });

      describe("establishment rights", () => {
        it("that establishment rep email is also the connected user email", async () => {
          expectToEqual(
            await getConvention.execute(
              { conventionId: convention.id },
              {
                userId: establishmentRep.id,
              },
            ),
            {
              ...convention,
              agencyName: agency.name,
              agencyDepartment: agency.address.departmentCode,
              agencyKind: agency.kind,
              agencySiret: agency.agencySiret,
              agencyCounsellorEmails: agency.counsellorEmails,
              agencyValidatorEmails: agency.validatorEmails,
            },
          );
        });

        it("that establishment tutor email is also the connected user email", async () => {
          expectToEqual(
            await getConvention.execute(
              { conventionId: conventionWithEstablishmentTutor.id },
              {
                userId: tutor.id,
              },
            ),
            {
              ...conventionWithEstablishmentTutor,
              agencyName: agency.name,
              agencyDepartment: agency.address.departmentCode,
              agencyKind: agency.kind,
              agencySiret: agency.agencySiret,
              agencyCounsellorEmails: agency.counsellorEmails,
              agencyValidatorEmails: agency.validatorEmails,
            },
          );
        });

        it.each(establishmentsRoles)(
          "that the connected user is also %s of the existing establishment with same siret in convention",
          async (role) => {
            const establishmentWithRights = new EstablishmentAggregateBuilder(
              establishmentWithSiret,
            )
              .withUserRights([
                {
                  userId: johnDoe.id,
                  role,
                  job: "",
                  phone: "",
                },
              ])
              .build();

            uow.establishmentAggregateRepository.establishmentAggregates = [
              establishmentWithRights,
            ];

            expectToEqual(
              await getConvention.execute(
                { conventionId: convention.id },
                {
                  userId: johnDoe.id,
                },
              ),
              {
                ...convention,
                agencyName: agency.name,
                agencyDepartment: agency.address.departmentCode,
                agencyKind: agency.kind,
                agencySiret: agency.agencySiret,
                agencyCounsellorEmails: agency.counsellorEmails,
                agencyValidatorEmails: agency.validatorEmails,
              },
            );
          },
        );
      });

      it("the user is backofficeAdmin", async () => {
        expectToEqual(
          await getConvention.execute(
            { conventionId: convention.id },
            {
              userId: backofficeAdminUser.id,
            },
          ),
          {
            ...convention,
            agencyName: agency.name,
            agencyDepartment: agency.address.departmentCode,
            agencyKind: agency.kind,
            agencySiret: agency.agencySiret,
            agencyCounsellorEmails: agency.counsellorEmails,
            agencyValidatorEmails: agency.validatorEmails,
          },
        );
      });
    });

    describe("with ConventionJwtPayload", () => {
      beforeEach(() => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [counsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];
      });
      it.each([
        {
          role: "establishment-representative",
          email: convention.signatories.establishmentRepresentative.email,
        },
        {
          role: "establishment-tutor",
          email: convention.establishmentTutor.email,
        },
        {
          role: "beneficiary",
          email: convention.signatories.beneficiary.email,
        },
      ] satisfies { role: Role; email: string }[])(
        "email hash match email hash for role '$role' in convention",
        async ({ role, email }: { role: Role; email: string }) => {
          expectToEqual(
            await getConvention.execute(
              { conventionId: convention.id },
              {
                role,
                emailHash: makeEmailHash(email),
                applicationId: convention.id,
              },
            ),
            {
              ...convention,
              agencyName: agency.name,
              agencyDepartment: agency.address.departmentCode,
              agencyKind: agency.kind,
              agencySiret: agency.agencySiret,
              agencyCounsellorEmails: [counsellor.email],
              agencyValidatorEmails: [validator.email],
            },
          );
        },
      );

      it.each([
        {
          role: "counsellor",
          email: counsellor.email,
        },
        {
          role: "validator",
          email: validator.email,
        },
      ] satisfies { role: Role; email: string }[])(
        "email hash match user email hash and has '$role' agency right",
        async ({ role, email }: { role: Role; email: string }) => {
          uow.userRepository.users = [counsellor, validator];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [validator.id]: {
                isNotifiedByEmail: false,
                roles: ["validator"],
              },
              [counsellor.id]: {
                isNotifiedByEmail: false,
                roles: ["counsellor"],
              },
            }),
          ];

          expectToEqual(
            await getConvention.execute(
              { conventionId: convention.id },
              {
                role,
                emailHash: makeEmailHash(email),
                applicationId: convention.id,
              },
            ),
            {
              ...convention,
              agencyName: agency.name,
              agencyDepartment: agency.address.departmentCode,
              agencyKind: agency.kind,
              agencySiret: agency.agencySiret,
              agencyCounsellorEmails: [counsellor.email],
              agencyValidatorEmails: [validator.email],
            },
          );
        },
      );

      it("user is a FtAdvisor", async () => {
        expectToEqual(
          await getConvention.execute(
            { conventionId: ftConnectedConvention.id },
            {
              role: "validator",
              emailHash: makeEmailHash(ftAdvisorEmail),
              applicationId: ftConnectedConvention.id,
            },
          ),
          {
            ...ftConnectedConvention,
            agencyName: agency.name,
            agencyDepartment: agency.address.departmentCode,
            agencyKind: agency.kind,
            agencySiret: agency.agencySiret,
            agencyCounsellorEmails: [counsellor.email],
            agencyValidatorEmails: [validator.email],
          },
        );
      });
    });
  });
});

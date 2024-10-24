import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionJwtPayload,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  Role,
  expectPromiseToFailWithError,
  expectToEqual,
  stringToMd5,
} from "shared";
import { ForbiddenError, NotFoundError } from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { GetConvention } from "./GetConvention";

describe("Get Convention", () => {
  const agency = new AgencyDtoBuilder()
    .withCounsellorEmails(["counsellor@mail.fr"])
    .withValidatorEmails(["validator@mail.fr"])
    .build();
  const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
  const conventionWithEstablishmentTutor = new ConventionDtoBuilder()
    .withAgencyId(agency.id)
    .withEstablishmentTutor({
      email: "establishment-tutor@mail.fr",
      firstName: "John",
      lastName: "Doe",
      role: "establishment-tutor",
      phone: "+33602010203",
      job: "Job",
    })
    .build();
  let getConvention: GetConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConvention = new GetConvention(new InMemoryUowPerformer(uow));
  });

  describe("Wrong paths", () => {
    describe("Forbidden error", () => {
      it("When no auth payload provided", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }),
          new ForbiddenError("No auth payload provided"),
        );
      });

      it("When the user don't have correct role on inclusion connected users", async () => {
        const user: InclusionConnectedUser = {
          id: "my-user-id",
          email: "my-user@email.com",
          firstName: "John",
          lastName: "Doe",
          agencyRights: [
            { roles: ["to-review"], agency, isNotifiedByEmail: false },
          ],
          dashboards: { agencies: {}, establishments: {} },
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };
        uow.userRepository.setInclusionConnectedUsers([user]);
        uow.agencyRepository.setAgencies([agency]);
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            { userId: "my-user-id" },
          ),
          new ForbiddenError(
            `User with id 'my-user-id' is not allowed to access convention with id '${convention.id}'`,
          ),
        );
      });

      describe("with ConventionJwtPayload", () => {
        it("When convention id in jwt token does not match provided one", async () => {
          uow.agencyRepository.setAgencies([agency]);
          uow.conventionRepository.setConventions([convention]);

          await expectPromiseToFailWithError(
            getConvention.execute(
              { conventionId: convention.id },
              {
                role: "establishment-representative",
                applicationId: "not-matching-convention-id",
                emailHash: "",
              },
            ),
            new ForbiddenError(
              `This token is not allowed to access convention with id ${convention.id}. Role was 'establishment-representative'`,
            ),
          );
        });

        it.each([
          "validator",
          "beneficiary",
          "counsellor",
          "establishment-representative",
        ] as const)(
          "When the user email for role %s is not used in the convention anymore",
          async (role: Role) => {
            uow.agencyRepository.setAgencies([agency]);
            uow.conventionRepository.setConventions([convention]);
            const payload: ConventionJwtPayload = {
              role,
              emailHash: "oldHash",
              applicationId: convention.id,
              iat: 1,
              version: 1,
            };

            await expectPromiseToFailWithError(
              getConvention.execute({ conventionId: convention.id }, payload),
              new ForbiddenError(
                `User has no right on convention '${convention.id}'`,
              ),
            );
          },
        );

        it("when the user has inclusion connect but not for the agency of this convention", async () => {
          uow.agencyRepository.setAgencies([agency]);
          uow.conventionRepository.setConventions([convention]);
          const inclusionConnectedUser: InclusionConnectedUser = {
            id: "my-user-id",
            email: "john@mail.com",
            firstName: "John",
            lastName: "Doe",
            agencyRights: [
              {
                agency: new AgencyDtoBuilder().withId("another-agency").build(),
                roles: ["validator"],
                isNotifiedByEmail: false,
              },
            ],
            dashboards: { agencies: {}, establishments: {} },
            externalId: "john-external-id",
            createdAt: new Date().toISOString(),
          };
          uow.userRepository.setInclusionConnectedUsers([
            inclusionConnectedUser,
          ]);
          const payload: ConventionJwtPayload = {
            role: "validator",
            emailHash: stringToMd5(inclusionConnectedUser.email),
            applicationId: convention.id,
            iat: 1,
            version: 1,
          };

          await expectPromiseToFailWithError(
            getConvention.execute({ conventionId: convention.id }, payload),
            new ForbiddenError(
              `User has no right on convention '${convention.id}'`,
            ),
          );
        });
      });
    });

    describe("Not found error", () => {
      it("When the Convention does not exist", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            {
              role: "establishment-representative",
              applicationId: convention.id,
              emailHash: "",
            },
          ),
          new NotFoundError(`No convention found with id ${convention.id}`),
        );
      });

      it("When if user is not on inclusion connected users", async () => {
        uow.agencyRepository.setAgencies([agency]);
        uow.conventionRepository.setConventions([convention]);
        const userId = "my-user-id";

        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }, { userId }),
          new NotFoundError(`No user found with id '${userId}'`),
        );
      });
    });
  });

  describe("Right paths", () => {
    beforeEach(() => {
      uow.agencyRepository.setAgencies([agency]);
      uow.conventionRepository.setConventions([convention]);
    });

    describe("Inclusion connected user", () => {
      it("that have agency rights", async () => {
        const user: InclusionConnectedUser = {
          id: "my-user-id",
          email: "my-user@email.com",
          firstName: "John",
          lastName: "Doe",
          agencyRights: [
            { roles: ["validator"], agency, isNotifiedByEmail: false },
          ],
          dashboards: { agencies: {}, establishments: {} },
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };
        uow.userRepository.setInclusionConnectedUsers([user]);
        const jwtPayload: InclusionConnectDomainJwtPayload = {
          userId: "my-user-id",
        };

        const fetchedConvention = await getConvention.execute(
          { conventionId: convention.id },
          jwtPayload,
        );
        expectToEqual(fetchedConvention, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });

      it("that establishment rep is also the inclusion connected user", async () => {
        const user: InclusionConnectedUser = {
          id: "my-user-id",
          email: convention.signatories.establishmentRepresentative.email,
          firstName: "John",
          lastName: "Doe",
          agencyRights: [],
          dashboards: { agencies: {}, establishments: {} },
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };
        uow.userRepository.setInclusionConnectedUsers([user]);

        const jwtPayload: InclusionConnectDomainJwtPayload = {
          userId: user.id,
        };

        const fetchedConvention = await getConvention.execute(
          { conventionId: convention.id },
          jwtPayload,
        );

        expectToEqual(fetchedConvention, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });

      it("that establishment tutor is also the inclusion connected user", async () => {
        uow.conventionRepository.setConventions([
          conventionWithEstablishmentTutor,
        ]);
        const user: InclusionConnectedUser = {
          id: "my-tutor-user-id",
          email: conventionWithEstablishmentTutor.establishmentTutor.email,
          firstName: "John",
          lastName: "Doe",
          agencyRights: [],
          dashboards: { agencies: {}, establishments: {} },
          externalId: "john-tutor-external-id",
          createdAt: new Date().toISOString(),
        };
        uow.userRepository.setInclusionConnectedUsers([user]);

        const jwtPayload: InclusionConnectDomainJwtPayload = {
          userId: user.id,
        };

        const fetchedConvention = await getConvention.execute(
          { conventionId: conventionWithEstablishmentTutor.id },
          jwtPayload,
        );

        expectToEqual(fetchedConvention, {
          ...conventionWithEstablishmentTutor,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });

      it("the user is backofficeAdmin", async () => {
        const backofficeAdminUser = new InclusionConnectedUserBuilder()
          .withIsAdmin(true)
          .build();

        uow.userRepository.setInclusionConnectedUsers([backofficeAdminUser]);

        const conventionResult = await getConvention.execute(
          { conventionId: convention.id },
          {
            userId: backofficeAdminUser.id,
          },
        );

        expectToEqual(conventionResult, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });
    });

    describe("with ConventionJwtPayload", () => {
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
        {
          role: "counsellor",
          email: agency.counsellorEmails[0],
        },
        {
          role: "validator",
          email: agency.validatorEmails[0],
        },
      ] as const)(
        "user $role  has no inclusion connect",
        async ({ role, email }: { role: Role; email: string }) => {
          const payload: ConventionJwtPayload = {
            role,
            emailHash: stringToMd5(email),
            applicationId: convention.id,
            iat: 1,
            version: 1,
          };

          const conventionResult = await getConvention.execute(
            { conventionId: convention.id },
            payload,
          );

          expectToEqual(conventionResult, {
            ...convention,
            agencyName: agency.name,
            agencyDepartment: agency.address.departmentCode,
            agencyKind: agency.kind,
            agencySiret: agency.agencySiret,
            agencyCounsellorEmails: agency.counsellorEmails,
            agencyValidatorEmails: agency.validatorEmails,
          });
        },
      );

      it("user has inclusion connect", async () => {
        const inclusionConnectedUser: InclusionConnectedUser = {
          id: "my-user-id",
          email: "john@mail.com",
          firstName: "John",
          lastName: "Doe",
          agencyRights: [
            { agency, roles: ["validator"], isNotifiedByEmail: false },
          ],
          dashboards: { agencies: {}, establishments: {} },
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };
        uow.userRepository.setInclusionConnectedUsers([inclusionConnectedUser]);
        const payload: ConventionJwtPayload = {
          role: "validator",
          emailHash: stringToMd5(inclusionConnectedUser.email),
          applicationId: convention.id,
          iat: 1,
          version: 1,
        };

        const conventionResult = await getConvention.execute(
          { conventionId: convention.id },
          payload,
        );

        expectToEqual(conventionResult, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });

      it("user is a PeAdvisor", async () => {
        const peAdvisorEmail = "pe-advisor@mail.fr";
        const peConnectedConvention = new ConventionDtoBuilder(convention)
          .withFederatedIdentity({
            provider: "peConnect",
            token: "some-id",
            payload: {
              advisor: {
                email: peAdvisorEmail,
                firstName: "john",
                lastName: "doe",
                type: "PLACEMENT",
              },
            },
          })
          .build();
        uow.conventionRepository.setConventions([peConnectedConvention]);
        const payload: ConventionJwtPayload = {
          role: "validator",
          emailHash: stringToMd5(peAdvisorEmail),
          applicationId: convention.id,
          iat: 1,
          version: 1,
        };

        const conventionResult = await getConvention.execute(
          { conventionId: convention.id },
          payload,
        );

        expectToEqual(conventionResult, {
          ...peConnectedConvention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });
    });
  });
});

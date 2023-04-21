import { addDays, subYears } from "date-fns";
import { keys } from "ramda";
import { reasonableSchedule } from "../schedule/ScheduleUtils";
import { splitCasesBetweenPassingAndFailing } from "../test.helpers";
import {
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionInternshipKindSpecific,
  ConventionReadDto,
  conventionStatuses,
  EstablishmentRepresentative,
  InternshipKind,
  maximumCalendarDayByInternshipKind,
} from "./convention.dto";
import {
  conventionInternshipKindSpecificSchema,
  conventionReadSchema,
  conventionSchema,
} from "./convention.schema";
import { ConventionDtoBuilder, DATE_START } from "./ConventionDtoBuilder";

const currentEmployer: BeneficiaryCurrentEmployer = {
  role: "beneficiary-current-employer",
  email: "email@email.com",
  phone: "",
  firstName: "",
  lastName: "",
  job: "",
  businessSiret: "",
  businessName: "",
};
const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "beneficiary-representative",
  firstName: "",
  lastName: "",
  phone: "",
  email: "demandeur@mail.fr",
};

describe("conventionDtoSchema", () => {
  it("accepts valid Convention", () => {
    const convention = new ConventionDtoBuilder().build();
    expectConventionDtoToBeValid(convention);
  });

  describe("email validations", () => {
    it("ignores accents and case on emails", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryEmail("Jérôme_Truc@associés.fr")
        .build();
      const parsedConvention = conventionSchema.parse(convention);
      expect(parsedConvention.signatories.beneficiary.email).toBe(
        "jerome_truc@associes.fr",
      );
    });
    it("allow empty emergency contact email", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryEmergencyContactEmail("")
        .build();
      const parsedConvention = conventionSchema.parse(convention);
      expect(
        parsedConvention.signatories.beneficiary.emergencyContactEmail,
      ).toBe("");
    });
    it("ignores accents on emergency contact email", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryEmergencyContactEmail("Jérôme_Truc@associés.fr")
        .build();
      const parsedConvention = conventionSchema.parse(convention);
      expect(
        parsedConvention.signatories.beneficiary.emergencyContactEmail,
      ).toBe("jerome_truc@associes.fr");
    });

    it("rejects equal beneficiary and establishment tutor emails", () => {
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder()
          .withBeneficiaryEmail("demandeur@mail.fr")
          .withEstablishmentTutorEmail("demandeur@mail.fr")
          .build(),
      );
    });

    it("rejects equal beneficiary and establishment representative emails", () => {
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder()
          .withBeneficiaryEmail("demandeur@mail.fr")
          .withEstablishmentRepresentativeEmail("demandeur@mail.fr")
          .build(),
      );
    });

    it("rejects equal beneficiary and beneficiary representative emails", () => {
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder()
          .withBeneficiaryEmail("demandeur@mail.fr")
          .withBeneficiaryRepresentative(beneficiaryRepresentative)
          .build(),
      );
    });

    it("rejects equal beneficiary representative and establishment tutor emails", () => {
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder()
          .withEstablishmentTutorEmail(beneficiaryRepresentative.email)
          .withBeneficiaryRepresentative(beneficiaryRepresentative)
          .build(),
      );
    });

    it("rejects equal beneficiary current employer and other signatories", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryCurrentEmployer(currentEmployer)
        .build();
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder(convention)
          .withBeneficiaryEmail(currentEmployer.email)
          .build(),
      );
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder(convention)
          .withBeneficiaryRepresentative({
            ...currentEmployer,
            role: "beneficiary-representative",
          })
          .build(),
      );
      expectConventionDtoToBeInvalid(
        new ConventionDtoBuilder(convention)
          .withEstablishmentRepresentativeEmail(currentEmployer.email)
          .build(),
      );
    });

    it("confirm convention read schema inherit convention controls", () => {
      const validConventionRead: ConventionReadDto = {
        ...new ConventionDtoBuilder().build(),
        agencyName: "dsfsdfsdf",
        agencyDepartment: "75",
        externalId: "sdfsdff",
      };
      expect(() =>
        conventionReadSchema.parse(validConventionRead),
      ).not.toThrow();
      expect(conventionReadSchema.parse(validConventionRead)).toBeTruthy();
      const invalidConventionRead: ConventionReadDto = {
        ...new ConventionDtoBuilder()
          .withEstablishmentTutorEmail(beneficiaryRepresentative.email)
          .withBeneficiaryRepresentative(beneficiaryRepresentative)
          .build(),
        agencyName: "dsfsdfsdf",
        agencyDepartment: "90",
        externalId: "sdfsdff",
      };
      expect(() => conventionReadSchema.parse(invalidConventionRead)).toThrow();
    });
  });

  it("rejects when string with spaces are provided", () => {
    const convention = new ConventionDtoBuilder().withId("  ").build();

    expectConventionDtoToBeInvalid(convention);
  });

  it("rejects when phone is not a valid number", () => {
    const convention = new ConventionDtoBuilder()
      .withBeneficiaryPhone("wrong")
      .build();

    expectConventionDtoToBeInvalid(convention);

    const convention2 = new ConventionDtoBuilder()
      .withBeneficiaryPhone("0203stillWrong")
      .build();

    expectConventionDtoToBeInvalid(convention2);
  });

  it("rejects when establishmentTutorPhone is not a valid number", () => {
    const convention = new ConventionDtoBuilder()
      .withEstablishementTutorPhone("wrong")
      .build();

    expectConventionDtoToBeInvalid(convention);
  });

  describe("constraint on dates", () => {
    it("rejects misformatted submission dates", () => {
      const convention = new ConventionDtoBuilder()
        .withDateSubmission("not-a-date")
        .build();

      expectConventionDtoToBeInvalid(convention);
    });

    it("rejects misformatted start dates", () => {
      const convention = new ConventionDtoBuilder()
        .withDateStart("not-a-date")
        .build();

      expectConventionDtoToBeInvalid(convention);
    });

    it("rejects misformatted end dates", () => {
      const convention = new ConventionDtoBuilder()
        .withDateEnd("not-a-date")
        .build();

      expectConventionDtoToBeInvalid(convention);
    });

    it("rejects start dates that are after the end date", () => {
      const convention = new ConventionDtoBuilder()
        .withDateStart("2021-01-10")
        .withDateEnd("2021-01-03")
        .build();

      expectConventionDtoToBeInvalid(convention);
    });

    it("accept start dates that are tuesday if submitting on previous friday", () => {
      const convention = new ConventionDtoBuilder()
        .withDateSubmission("2021-10-15") // which is a friday
        .withDateStart("2021-10-19") // which is the following tuesday
        .withDateEnd("2021-10-30")
        .build();

      expectConventionDtoToBeValid(convention);
    });

    describe("Correctly handles max authorized number of days", () => {
      const calendarDayAndInternShips = keys(
        maximumCalendarDayByInternshipKind,
      ).map((intershipKind) => ({
        intershipKind,
        maxCalendarDays: maximumCalendarDayByInternshipKind[intershipKind],
      }));

      it.each(calendarDayAndInternShips)(
        "for $intershipKind rejects when it is more than $maxCalendarDays",
        ({ intershipKind, maxCalendarDays }) => {
          const convention = new ConventionDtoBuilder()
            .withInternshipKind(intershipKind)
            .withDateStart(DATE_START)
            .withDateEnd(
              addDays(new Date(DATE_START), maxCalendarDays + 1).toISOString(),
            )
            .build();

          expectConventionDtoToBeInvalid(convention);
        },
      );

      it.each(calendarDayAndInternShips)(
        "for $intershipKind accepts end date that are <= $maxCalendarDays calendar days after the start date",
        ({ intershipKind, maxCalendarDays }) => {
          const dateStart = DATE_START;
          const dateEnd = addDays(
            new Date(DATE_START),
            maxCalendarDays,
          ).toISOString();
          const convention = new ConventionDtoBuilder()
            .withInternshipKind(intershipKind)
            .withDateStart(dateStart)
            .withDateEnd(dateEnd)
            .build();

          expectConventionDtoToBeValid(convention);
        },
      );
    });
    describe("CCI specific, minor under 16yo", () => {
      it("max week hours depends on beneficiary age", () => {
        const dateStart = DATE_START;
        const dateEnd = addDays(new Date(DATE_START), 4).toISOString();
        const convention = new ConventionDtoBuilder()
          .withInternshipKind("mini-stage-cci")
          .withDateStart(dateStart)
          .withDateEnd(dateEnd)
          .withSchedule(reasonableSchedule)
          .withBeneficiary({
            birthdate: new Date("2008-05-26").toISOString(),
            firstName: "Jean",
            lastName: "Bono",
            role: "beneficiary",
            email: "jean@bono.com",
            levelOfEducation: "4ème",
            phone: "0836656565",
          })
          .build();
        expectConventionDtoToBeInvalid(convention);
      });
    });
    describe("status that are available without signatures", () => {
      const [allowWithoutSignature, failingWithoutSignature] =
        splitCasesBetweenPassingAndFailing(conventionStatuses, [
          "DRAFT",
          "READY_TO_SIGN",
          "PARTIALLY_SIGNED",
          "REJECTED",
          "CANCELLED",
        ]);

      it.each(allowWithoutSignature.map((status) => ({ status })))(
        "WITHOUT signatures, a Convention CAN be $status",
        ({ status }) => {
          const convention = new ConventionDtoBuilder()
            .withStatus(status)
            .notSigned()
            .build();
          expectConventionDtoToBeValid(convention);
        },
      );

      it.each(failingWithoutSignature.map((status) => ({ status })))(
        "WITHOUT signatures, a Convention CANNOT be $status",
        ({ status }) => {
          const convention = new ConventionDtoBuilder()
            .withStatus(status)
            .notSigned()
            .build();
          expectConventionDtoToBeInvalid(convention);
        },
      );
    });
  });

  describe("differentiate beneficiaries according to internshipkind", () => {
    const establishmentRepresentative: EstablishmentRepresentative = {
      email: "b@b.com",
      firstName: "dfssd",
      lastName: "fghfg",
      phone: "022334455",
      role: "establishment-representative",
    };
    const beneficiaryStudent: Beneficiary<"mini-stage-cci"> = {
      birthdate: new Date().toISOString(),
      levelOfEducation: "1ère",
      email: "a@a.com",
      firstName: "student",
      lastName: "student",
      phone: "0011223344",
      role: "beneficiary",
    };
    const beneficiary: Beneficiary<"immersion"> = {
      birthdate: new Date().toISOString(),
      email: "a@a.com",
      firstName: "sdfgf",
      lastName: "sdfs",
      phone: "0011223344",
      role: "beneficiary",
    };

    it("right path internship immersion", () => {
      const conventionInternshipKindSpecificImmersion: ConventionInternshipKindSpecific<"immersion"> =
        {
          internshipKind: "immersion",
          signatories: {
            beneficiary,
            establishmentRepresentative,
          },
        };
      expect(() =>
        conventionInternshipKindSpecificSchema.parse(
          conventionInternshipKindSpecificImmersion,
        ),
      ).not.toThrow();
      expect(
        conventionInternshipKindSpecificSchema.parse(
          conventionInternshipKindSpecificImmersion,
        ),
      ).toBeTruthy();
    });

    it("right path internship mini-stage-cci", () => {
      const conventionInternshipKindSpecificCci: ConventionInternshipKindSpecific<"mini-stage-cci"> =
        {
          internshipKind: "mini-stage-cci",
          signatories: {
            beneficiary: beneficiaryStudent,
            establishmentRepresentative,
          },
        };
      expect(() =>
        conventionInternshipKindSpecificSchema.parse(
          conventionInternshipKindSpecificCci,
        ),
      ).not.toThrow();
      expect(
        conventionInternshipKindSpecificSchema.parse(
          conventionInternshipKindSpecificCci,
        ),
      ).toBeTruthy();
    });

    it("bad path internship mini-stage-cci", () => {
      const badConventionInternshipKindSpecific: ConventionInternshipKindSpecific<InternshipKind> =
        {
          internshipKind: "mini-stage-cci",
          signatories: {
            beneficiary,
            establishmentRepresentative,
          },
        };
      expect(() =>
        conventionInternshipKindSpecificSchema.parse(
          badConventionInternshipKindSpecific,
        ),
      ).toThrow();
    });
  });

  it("rejects when beneficiary age is under 16yr with internship kind 'immersion'", () => {
    const immersionStartDate = new Date("2022-01-01");
    const beneficiary: Beneficiary<"immersion"> = {
      birthdate: addDays(subYears(immersionStartDate, 16), 1).toISOString(),
      email: "a@a.com",
      firstName: "sdfgf",
      lastName: "sdfs",
      phone: "0011223344",
      role: "beneficiary",
    };

    const convention = new ConventionDtoBuilder()
      .withInternshipKind("immersion")
      .withDateStart(immersionStartDate.toISOString())
      .withDateEnd(new Date("2022-01-02").toISOString())
      .withBeneficiary(beneficiary)
      .build();

    expectConventionDtoToBeInvalid(convention);
  });
});

const expectConventionDtoToBeValid = (validConvention: ConventionDto): void => {
  expect(() => conventionSchema.parse(validConvention)).not.toThrow();
  expect(conventionSchema.parse(validConvention)).toBeTruthy();
};

const expectConventionDtoToBeInvalid = (conventionDto: ConventionDto) =>
  expect(() => conventionSchema.parse(conventionDto)).toThrow();

import { parseISO } from "date-fns";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { ValidatedConventionFinalConfirmationParams } from "../../../domain/convention/ports/EmailGateway";
import {
  getValidatedApplicationFinalConfirmationParams,
  NotifyAllActorsOfFinalApplicationValidation,
} from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import {
  LegacyScheduleDto,
  reasonableSchedule,
} from "shared/src/schedule/ScheduleSchema";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { AgencyDtoBuilder } from "../../../../../shared/src/agency/AgencyDtoBuilder";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
import { ConventionEntityBuilder } from "../../../_testBuilders/ConventionEntityBuilder";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../../../adapters/secondary/core/EmailFilterImplementations";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { ConventionDto } from "shared/src/convention/convention.dto";

const validConvention: ConventionDto = new ConventionEntityBuilder()
  .build()
  .toDto();

const counsellorEmail = "counsellor@email.fr";

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let emailFilter: EmailFilter;
  let emailGw: InMemoryEmailGateway;
  let agency: AgencyDto;

  beforeEach(() => {
    emailFilter = new AlwaysAllowEmailFilter();
    emailGw = new InMemoryEmailGateway();
    agency = defaultAgency;
  });

  const createUseCase = () =>
    new NotifyAllActorsOfFinalApplicationValidation(
      emailFilter,
      emailGw,
      new InMemoryAgencyRepository([agency]),
    );

  it("Sends no emails when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(validConvention);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  it("Sends confirmation email to beneficiary when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([validConvention.email]);

    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [validConvention.email],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("Sends confirmation email to mentor when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([validConvention.mentorEmail]);

    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [validConvention.mentorEmail],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("Sends confirmation email to counsellor when on allowList", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();
    emailFilter = new AllowListEmailFilter([counsellorEmail]);

    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [counsellorEmail],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("Sends confirmation email to beneficiary, mentor, and counsellor when on allowList", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();
    emailFilter = new AllowListEmailFilter([
      counsellorEmail,
      validConvention.email,
      validConvention.mentorEmail,
    ]);

    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [validConvention.email, validConvention.mentorEmail, counsellorEmail],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("Sends confirmation email to beneficiary, mentor, and counsellor when unrestricted email sending is allowed", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();
    await createUseCase().execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [validConvention.email, validConvention.mentorEmail, counsellorEmail],
      sentEmails[0],
      agency,
      validConvention,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  const agency = new AgencyDtoBuilder(defaultAgency)
    .withQuestionnaireUrl("testQuestionnaireUrl")
    .withSignature("testSignature")
    .build();

  it("simple application", () => {
    const application = new ConventionDtoBuilder()
      .withImmersionAddress("immersionAddress")
      .withSanitaryPrevention(true)
      .withSanitaryPreventionDescription("sanitaryPreventionDescription")
      .withIndividualProtection(true)
      .withSchedule(reasonableSchedule)
      .build();

    const expectedParams: ValidatedConventionFinalConfirmationParams = {
      totalHours: 56,
      beneficiaryFirstName: application.firstName,
      beneficiaryLastName: application.lastName,
      emergencyContact: application.emergencyContact,
      emergencyContactPhone: application.emergencyContactPhone,
      dateStart: parseISO(application.dateStart).toLocaleDateString("fr"),
      dateEnd: parseISO(application.dateEnd).toLocaleDateString("fr"),
      mentorName: application.mentor,
      scheduleText: prettyPrintSchedule(application.schedule),
      businessName: application.businessName,
      immersionAddress: "immersionAddress",
      immersionAppellationLabel:
        application.immersionAppellation.appellationLabel,
      immersionActivities: application.immersionActivities,
      immersionSkills: application.immersionSkills ?? "Non renseigné",
      sanitaryPrevention: "sanitaryPreventionDescription",
      individualProtection: "oui",
      questionnaireUrl: agency.questionnaireUrl,
      signature: agency.signature,
    };

    expect(
      getValidatedApplicationFinalConfirmationParams(agency, application),
    ).toEqual(expectedParams);
  });

  it("prioritizes legacy schedule when available", () => {
    const legacySchedule: LegacyScheduleDto = {
      workdays: ["lundi"],
      description: "legacyScheduleDescription",
    };
    const application = new ConventionDtoBuilder()
      .withLegacySchedule(legacySchedule)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.scheduleText).toEqual(
      prettyPrintLegacySchedule(legacySchedule),
    );
  });

  it("prints correct sanitaryPreventionMessage when missing", () => {
    const application = new ConventionDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.sanitaryPrevention).toBe("non");
  });

  it("prints correct individualProtection when missing", () => {
    const application = new ConventionDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.individualProtection).toBe("non");
  });
});

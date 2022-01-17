import { parseISO } from "date-fns";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { ValidatedApplicationFinalConfirmationParams } from "../../../domain/immersionApplication/ports/EmailGateway";
import {
  getValidatedApplicationFinalConfirmationParams,
  NotifyAllActorsOfFinalApplicationValidation,
} from "../../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { LegacyScheduleDto } from "../../../shared/ScheduleSchema";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../shared/ScheduleUtils";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectEmailFinalValidationConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../../../adapters/secondary/core/EmailFilterImplementations";
import { AgencyConfig } from "../../../domain/immersionApplication/ports/AgencyRepository";

const validImmersionApplication: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();

const counsellorEmail = "counsellor@email.fr";

const defaultAgencyConfig = AgencyConfigBuilder.create(
  validImmersionApplication.agencyId,
).build();

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let emailFilter: EmailFilter;
  let emailGw: InMemoryEmailGateway;
  let agencyConfig: AgencyConfig;

  beforeEach(() => {
    emailFilter = new AlwaysAllowEmailFilter();
    emailGw = new InMemoryEmailGateway();
    agencyConfig = defaultAgencyConfig;
  });

  const createUseCase = () => {
    return new NotifyAllActorsOfFinalApplicationValidation(
      emailFilter,
      emailGw,
      new InMemoryAgencyRepository([agencyConfig]),
    );
  };

  test("Sends no emails when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(validImmersionApplication);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([validImmersionApplication.email]);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validImmersionApplication.email],
      sentEmails[0],
      agencyConfig,
      validImmersionApplication,
    );
  });

  test("Sends confirmation email to mentor when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([
      validImmersionApplication.mentorEmail,
    ]);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validImmersionApplication.mentorEmail],
      sentEmails[0],
      agencyConfig,
      validImmersionApplication,
    );
  });

  test("Sends confirmation email to counsellor when on allowList", async () => {
    agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
      .withCounsellorEmails([counsellorEmail])
      .build();
    emailFilter = new AllowListEmailFilter([counsellorEmail]);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [counsellorEmail],
      sentEmails[0],
      agencyConfig,
      validImmersionApplication,
    );
  });

  test("Sends confirmation email to beneficiary, mentor, and counsellor when on allowList", async () => {
    agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
      .withCounsellorEmails([counsellorEmail])
      .build();
    emailFilter = new AllowListEmailFilter([
      counsellorEmail,
      validImmersionApplication.email,
      validImmersionApplication.mentorEmail,
    ]);

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        validImmersionApplication.email,
        validImmersionApplication.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[0],
      agencyConfig,
      validImmersionApplication,
    );
  });

  test("Sends confirmation email to beneficiary, mentor, and counsellor when unrestricted email sending is allowed", async () => {
    agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
      .withCounsellorEmails([counsellorEmail])
      .build();
    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        validImmersionApplication.email,
        validImmersionApplication.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[0],
      agencyConfig,
      validImmersionApplication,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  const agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
    .withQuestionnaireUrl("testQuestionnaireUrl")
    .withSignature("testSignature")
    .build();

  test("simple application", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withImmersionAddress("immersionAddress")
      .withSanitaryPrevention(true)
      .withSanitaryPreventionDescription("sanitaryPreventionDescription")
      .withIndividualProtection(true)
      .build();

    const expectedParams: ValidatedApplicationFinalConfirmationParams = {
      beneficiaryFirstName: application.firstName,
      beneficiaryLastName: application.lastName,
      dateStart: parseISO(application.dateStart).toLocaleDateString("fr"),
      dateEnd: parseISO(application.dateEnd).toLocaleDateString("fr"),
      mentorName: application.mentor,
      scheduleText: prettyPrintSchedule(application.schedule),
      businessName: application.businessName,
      immersionAddress: "immersionAddress",
      immersionProfession: application.immersionProfession,
      immersionActivities: application.immersionActivities,
      sanitaryPrevention: "sanitaryPreventionDescription",
      individualProtection: "oui",
      questionnaireUrl: agencyConfig.questionnaireUrl,
      signature: agencyConfig.signature,
    };

    expect(
      getValidatedApplicationFinalConfirmationParams(agencyConfig, application),
    ).toEqual(expectedParams);
  });

  test("prioritizes legacy schedule when available", () => {
    const legacySchedule: LegacyScheduleDto = {
      workdays: ["lundi"],
      description: "legacyScheduleDescription",
    };
    const application = new ImmersionApplicationDtoBuilder()
      .withLegacySchedule(legacySchedule)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agencyConfig,
      application,
    );

    expect(actualParms.scheduleText).toEqual(
      prettyPrintLegacySchedule(legacySchedule),
    );
  });

  test("prints correct sanitaryPreventionMessage when missing", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agencyConfig,
      application,
    );

    expect(actualParms.sanitaryPrevention).toEqual("non");
  });

  test("prints correct individualProtection when missing", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agencyConfig,
      application,
    );

    expect(actualParms.individualProtection).toEqual("non");
  });
});

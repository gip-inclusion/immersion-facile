import {
  AgencyConfigs,
  InMemoryAgencyRepository,
} from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
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

const validDemandeImmersion: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();

const counsellorEmail = "counsellor@email.fr";

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let agencyConfigs: AgencyConfigs;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    agencyConfigs = {
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty().build(),
    };
  });

  const createUseCase = () => {
    return new NotifyAllActorsOfFinalApplicationValidation(
      emailGw,
      allowList,
      new InMemoryAgencyRepository(agencyConfigs),
    );
  };

  test("Sends no emails when allowList is empty unrestriced email sending is disabled", async () => {
    await createUseCase().execute(validDemandeImmersion);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    allowList.add(validDemandeImmersion.email);

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email],
      sentEmails[0],
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to mentor when on allowList", async () => {
    allowList.add(validDemandeImmersion.mentorEmail);

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.mentorEmail],
      sentEmails[0],
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to counsellor when on allowList", async () => {
    agencyConfigs[validDemandeImmersion.agencyCode] =
      AgencyConfigBuilder.empty()
        .withCounsellorEmails([counsellorEmail])
        .build();
    allowList.add(counsellorEmail);

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [counsellorEmail],
      sentEmails[0],
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary, mentor, and counsellor when on allowList", async () => {
    agencyConfigs[validDemandeImmersion.agencyCode] =
      AgencyConfigBuilder.empty()
        .withCounsellorEmails([counsellorEmail])
        .build();
    allowList.add(counsellorEmail);
    allowList.add(validDemandeImmersion.email);
    allowList.add(validDemandeImmersion.mentorEmail);

    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        validDemandeImmersion.email,
        validDemandeImmersion.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[0],
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary, mentor, and counsellor when unrestricted email sending is allowed", async () => {
    agencyConfigs[validDemandeImmersion.agencyCode] =
      AgencyConfigBuilder.empty()
        .withCounsellorEmails([counsellorEmail])
        .allowUnrestrictedEmailSending()
        .build();
    await createUseCase().execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        validDemandeImmersion.email,
        validDemandeImmersion.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[0],
      agencyConfigs[validDemandeImmersion.agencyCode],
      validDemandeImmersion,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  const agencyConfig = AgencyConfigBuilder.empty()
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
      dateStart: application.dateStart,
      dateEnd: application.dateEnd,
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

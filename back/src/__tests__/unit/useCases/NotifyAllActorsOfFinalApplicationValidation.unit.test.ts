import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { ValidatedApplicationFinalConfirmationParams } from "../../../domain/immersionApplication/ports/EmailGateway";
import {
  getQuestionnaireUrl,
  getSignature,
  getValidatedApplicationFinalConfirmationParams,
  NotifyAllActorsOfFinalApplicationValidation,
} from "../../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { AgencyCode } from "../../../shared/agencies";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { LegacyScheduleDto } from "../../../shared/ScheduleSchema";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../shared/ScheduleUtils";
import { expectEmailFinalValidationConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";

const validDemandeImmersion: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();

const counsellorEmail = "counsellor@email.fr";

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingAgencies: Set<AgencyCode>;
  let counsellorEmails: Record<AgencyCode, string[]>;
  let sendConventionToAllActors: NotifyAllActorsOfFinalApplicationValidation;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    unrestrictedEmailSendingAgencies = new Set();
    counsellorEmails = {} as Record<AgencyCode, string[]>;
    sendConventionToAllActors = new NotifyAllActorsOfFinalApplicationValidation(
      emailGw,
      allowList,
      unrestrictedEmailSendingAgencies,
      counsellorEmails,
    );
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingAgencies is empty", async () => {
    await sendConventionToAllActors.execute(validDemandeImmersion);
    expect(emailGw.getSentEmails()).toHaveLength(0);
  });

  test("Sends confirmation email to beneficiary when on allowList", async () => {
    allowList.add(validDemandeImmersion.email);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to mentor when on allowList", async () => {
    allowList.add(validDemandeImmersion.mentorEmail);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.mentorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to counsellor when on allowList", async () => {
    counsellorEmails[validDemandeImmersion.agencyCode] = [counsellorEmail];
    allowList.add(counsellorEmail);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [counsellorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary, mentor, and counsellor when on allowList", async () => {
    counsellorEmails[validDemandeImmersion.agencyCode] = [counsellorEmail];
    allowList.add(counsellorEmail);
    allowList.add(validDemandeImmersion.email);
    allowList.add(validDemandeImmersion.mentorEmail);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        validDemandeImmersion.email,
        validDemandeImmersion.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary, mentor, and counsellor for unrestrictedEmailSendingAgencies", async () => {
    counsellorEmails[validDemandeImmersion.agencyCode] = [counsellorEmail];
    unrestrictedEmailSendingAgencies.add(validDemandeImmersion.agencyCode);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        validDemandeImmersion.email,
        validDemandeImmersion.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[0],
      validDemandeImmersion,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
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
      questionnaireUrl: getQuestionnaireUrl(application.agencyCode),
      signature: getSignature(application.agencyCode),
    };

    expect(getValidatedApplicationFinalConfirmationParams(application)).toEqual(
      expectedParams,
    );
  });

  test("AMIE_BOULONAIS application", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withAgencyCode("AMIE_BOULONAIS")
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.questionnaireUrl).toEqual(
      getQuestionnaireUrl("AMIE_BOULONAIS"),
    );
    expect(actualParms.signature).toEqual("L'équipe de l'AMIE du Boulonnais");
  });

  test("MLJ_GRAND_NARBONNE application", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withAgencyCode("MLJ_GRAND_NARBONNE")
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.questionnaireUrl).toEqual(
      getQuestionnaireUrl("MLJ_GRAND_NARBONNE"),
    );
    expect(actualParms.signature).toEqual(
      "L'équipe de la Mission Locale de Narbonne",
    );
  });

  test("prioritizes legacy schedule when available", () => {
    const legacySchedule: LegacyScheduleDto = {
      workdays: ["lundi"],
      description: "legacyScheduleDescription",
    };
    const application = new ImmersionApplicationDtoBuilder()
      .withLegacySchedule(legacySchedule)
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.scheduleText).toEqual(
      prettyPrintLegacySchedule(legacySchedule),
    );
  });

  test("prints correct sanitaryPreventionMessage when missing", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.sanitaryPrevention).toEqual("non");
  });

  test("prints correct individualProtection when missing", () => {
    const application = new ImmersionApplicationDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.individualProtection).toEqual("non");
  });
});

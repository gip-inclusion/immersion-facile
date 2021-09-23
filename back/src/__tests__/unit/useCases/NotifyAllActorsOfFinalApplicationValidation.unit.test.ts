import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { ValidatedApplicationFinalConfirmationParams } from "../../../domain/demandeImmersion/ports/EmailGateway";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../../domain/demandeImmersion/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";
import { LegacyScheduleDto } from "../../../shared/ScheduleSchema";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../shared/ScheduleUtils";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { expectEmailFinalValidationConfirmationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import {
  getQuestionnaireUrl,
  getValidatedApplicationFinalConfirmationParams,
} from "./../../../domain/demandeImmersion/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { DemandeImmersionDtoBuilder } from "./../../../_testBuilders/DemandeImmersionDtoBuilder";

const validDemandeImmersion: DemandeImmersionDto =
  new DemandeImmersionEntityBuilder().build().toDto();

describe("NotifyAllActorsOfFinalApplicationValidation", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;
  let sendConventionToAllActors: NotifyAllActorsOfFinalApplicationValidation;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    allowList = new Set();
    unrestrictedEmailSendingSources = new Set();
    sendConventionToAllActors = new NotifyAllActorsOfFinalApplicationValidation(
      emailGw,
      allowList,
      unrestrictedEmailSendingSources,
    );
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingSources is empty", async () => {
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

  test("Sends confirmation email to beneficiary and mentor when on allowList", async () => {
    allowList.add(validDemandeImmersion.email);
    allowList.add(validDemandeImmersion.mentorEmail);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email, validDemandeImmersion.mentorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });

  test("Sends confirmation email to beneficiary and mentor for unrestrictedEmailSendingSources", async () => {
    unrestrictedEmailSendingSources.add(validDemandeImmersion.source);

    await sendConventionToAllActors.execute(validDemandeImmersion);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [validDemandeImmersion.email, validDemandeImmersion.mentorEmail],
      sentEmails[0],
      validDemandeImmersion,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  test("simple application", () => {
    const application = new DemandeImmersionDtoBuilder()
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
      questionnaireUrl: "",
      signature: "L'immersion facile",
    };

    expect(getValidatedApplicationFinalConfirmationParams(application)).toEqual(
      expectedParams,
    );
  });

  test("BOULOGNE_SUR_MER application", () => {
    const application = new DemandeImmersionDtoBuilder()
      .withSource("BOULOGNE_SUR_MER")
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.questionnaireUrl).toEqual(
      getQuestionnaireUrl("BOULOGNE_SUR_MER"),
    );
    expect(actualParms.signature).toEqual("L'équipe de l'AMIE du Boulonnais");
  });

  test("NARBONNE application", () => {
    const application = new DemandeImmersionDtoBuilder()
      .withSource("NARBONNE")
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.questionnaireUrl).toEqual(
      getQuestionnaireUrl("NARBONNE"),
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
    const application = new DemandeImmersionDtoBuilder()
      .withLegacySchedule(legacySchedule)
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.scheduleText).toEqual(
      prettyPrintLegacySchedule(legacySchedule),
    );
  });

  test("prints correct sanitaryPreventionMessage when missing", () => {
    const application = new DemandeImmersionDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.sanitaryPrevention).toEqual("non");
  });

  test("prints correct individualProtection when missing", () => {
    const application = new DemandeImmersionDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms =
      getValidatedApplicationFinalConfirmationParams(application);

    expect(actualParms.individualProtection).toEqual("non");
  });
});

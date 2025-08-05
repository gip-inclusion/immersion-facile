import subDays from "date-fns/subDays";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  errors,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { InMemoryFranceTravailGateway } from "../adapters/france-travail-gateway/InMemoryFranceTravailGateway";
import {
  conventionStatusToFranceTravailStatus,
  type FranceTravailConvention,
} from "../ports/FranceTravailGateway";
import { ResyncOldConventionsToFt } from "./ResyncOldConventionsToFt";

describe("ResyncOldConventionsToFt use case", () => {
  const agencyFT = new AgencyDtoBuilder().withKind("pole-emploi").build();
  const conventionToSync1 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08b")
    .withAgencyId(agencyFT.id)
    .build();
  const conventionToSync2 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08a")
    .withAgencyId(agencyFT.id)
    .build();
  const conventionToSync3 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08d")
    .withAgencyId(agencyFT.id)
    .build();
  const conventionToSync4 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08e")
    .withAgencyId(agencyFT.id)
    .build();

  let uow: InMemoryUnitOfWork;
  let useCase: ResyncOldConventionsToFt;
  let timeGateway: CustomTimeGateway;
  let ftGateway: InMemoryFranceTravailGateway;

  beforeEach(() => {
    uow = createInMemoryUow();

    timeGateway = new CustomTimeGateway();
    ftGateway = new InMemoryFranceTravailGateway();
    useCase = new ResyncOldConventionsToFt(
      new InMemoryUowPerformer(uow),
      ftGateway,
      timeGateway,
      100,
    );
  });

  it("also broadcast assessment if present", async () => {
    uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
    uow.conventionRepository.setConventions([conventionToSync1]);
    uow.assessmentRepository.setAssessments([
      {
        _entityName: "Assessment",
        numberOfHoursActuallyMade: null,
        conventionId: conventionToSync1.id,
        status: "COMPLETED",
        endedWithAJob: false,
        establishmentFeedback: "commentaire",
        establishmentAdvices: "commentaire",
      },
    ]);
    uow.conventionsToSyncRepository.setForTesting([
      {
        id: conventionToSync1.id,
        status: "TO_PROCESS",
      },
    ]);

    const report = await useCase.execute();

    expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
      {
        id: conventionToSync1.id,
        status: "SUCCESS",
        processDate: timeGateway.now(),
      },
    ]);
    expectToEqual(ftGateway.legacyBroadcastConventionCalls, [
      conventionToConventionNotification(conventionToSync1, agencyFT),
    ]);
    expectToEqual(report, {
      success: 1,
      skips: {},
      errors: {},
    });
  });

  describe("when feature to standard format for convention broadcast is OFF", () => {
    beforeEach(() => {
      uow.featureFlagRepository.featureFlags = {
        ...uow.featureFlagRepository.featureFlags,
        enableStandardFormatBroadcastToFranceTravail: {
          kind: "boolean",
          isActive: false,
        },
      };
    });

    describe("Right paths", () => {
      it("broadcast two conventions to FT", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionRepository.setConventions([
          conventionToSync1,
          conventionToSync2,
        ]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
          {
            id: conventionToSync2.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
          conventionToSync2,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync2.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, [
          conventionToConventionNotification(conventionToSync1, agencyFT),
          conventionToConventionNotification(conventionToSync2, agencyFT),
        ]);
        expectToEqual(report, {
          success: 2,
          skips: {},
          errors: {},
        });
      });

      it("no convention to sync", async () => {
        uow.conventionsToSyncRepository.setForTesting([]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, []);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, []);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {},
          errors: {},
        });
      });

      it("when agency is not kind pole-emploi", async () => {
        const agencyCCI = new AgencyDtoBuilder().withKind("cci").build();
        const conventionToSync = new ConventionDtoBuilder()
          .withAgencyId(agencyCCI.id)
          .build();
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyCCI)];
        uow.conventionRepository.setConventions([conventionToSync]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [conventionToSync]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync.id,
            status: "SKIP",
            processDate: timeGateway.now(),
            reason: "Agency is not of kind pole-emploi",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {
            [conventionToSync.id]: "Agency is not of kind pole-emploi",
          },
          errors: {},
        });
      });

      it("only process convention with status TO_PROCESS and ERROR", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionRepository.setConventions([
          conventionToSync1,
          conventionToSync2,
          conventionToSync3,
          conventionToSync4,
        ]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
          {
            id: conventionToSync2.id,
            status: "ERROR",
            processDate: subDays(timeGateway.now(), 1),
            reason: "Random error",
          },
          {
            id: conventionToSync3.id,
            status: "SKIP",
            processDate: subDays(timeGateway.now(), 1),
            reason: "Feature flag enablePeConventionBroadcast not enabled",
          },
          {
            id: conventionToSync4.id,
            status: "SUCCESS",
            processDate: subDays(timeGateway.now(), 1),
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
          conventionToSync2,
          conventionToSync3,
          conventionToSync4,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync2.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync3.id,
            status: "SKIP",
            processDate: subDays(timeGateway.now(), 1),
            reason: "Feature flag enablePeConventionBroadcast not enabled",
          },
          {
            id: conventionToSync4.id,
            status: "SUCCESS",
            processDate: subDays(timeGateway.now(), 1),
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, [
          conventionToConventionNotification(conventionToSync1, agencyFT),
          conventionToConventionNotification(conventionToSync2, agencyFT),
        ]);
        expectToEqual(report, {
          success: 2,
          skips: {},
          errors: {},
        });
      });

      it("should consider limit", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionRepository.setConventions([
          conventionToSync1,
          conventionToSync2,
        ]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
          {
            id: conventionToSync2.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await new ResyncOldConventionsToFt(
          new InMemoryUowPerformer(uow),
          ftGateway,
          timeGateway,
          1,
        ).execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
          conventionToSync2,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync2.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, [
          conventionToConventionNotification(conventionToSync1, agencyFT),
        ]);
        expectToEqual(report, {
          success: 1,
          skips: {},
          errors: {},
        });
      });
    });

    describe("Wrong paths", () => {
      it("when no convention in conventionRepository should not sync convention", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, []);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "ERROR",
            processDate: timeGateway.now(),
            reason: errors.convention.notFound({
              conventionId: conventionToSync1.id,
            }).message,
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {},
          errors: {
            [conventionToSync1.id]: errors.convention.notFound({
              conventionId: conventionToSync1.id,
            }),
          },
        });
      });

      it("when no agency", async () => {
        uow.conventionRepository.setConventions([conventionToSync1]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "ERROR",
            processDate: timeGateway.now(),
            reason: errors.agency.notFound({ agencyId: agencyFT.id }).message,
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {},
          errors: {
            [conventionToSync1.id]: errors.agency.notFound({
              agencyId: agencyFT.id,
            }),
          },
        });
      });
    });
  });

  describe("when feature to standard format for convention broadcast is ON", () => {
    beforeEach(() => {
      uow.featureFlagRepository.featureFlags = {
        ...uow.featureFlagRepository.featureFlags,
        enableStandardFormatBroadcastToFranceTravail: {
          kind: "boolean",
          isActive: true,
        },
      };
    });

    describe("Right paths", () => {
      it("broadcast two conventions to FT", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionRepository.setConventions([
          conventionToSync1,
          conventionToSync2,
        ]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
          {
            id: conventionToSync2.id,
            status: "TO_PROCESS",
          },
        ]);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
          conventionToSync2,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync2.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(ftGateway.broadcastParamsCalls, [
          {
            eventType: "CONVENTION_UPDATED",
            convention: {
              ...conventionToSync1,
              agencyName: agencyFT.name,
              agencyDepartment: agencyFT.address.departmentCode,
              agencyKind: agencyFT.kind,
              agencySiret: agencyFT.agencySiret,
              agencyCounsellorEmails: [],
              agencyValidatorEmails: [],
            },
          },
          {
            eventType: "CONVENTION_UPDATED",
            convention: {
              ...conventionToSync2,
              agencyName: agencyFT.name,
              agencyDepartment: agencyFT.address.departmentCode,
              agencyKind: agencyFT.kind,
              agencySiret: agencyFT.agencySiret,
              agencyCounsellorEmails: [],
              agencyValidatorEmails: [],
            },
          },
        ]);
        expectToEqual(report, {
          success: 2,
          skips: {},
          errors: {},
        });
      });

      it("no convention to sync", async () => {
        uow.conventionsToSyncRepository.setForTesting([]);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, []);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, []);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(ftGateway.broadcastParamsCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {},
          errors: {},
        });
      });

      it("when agency is not kind pole-emploi", async () => {
        const agencyCCI = new AgencyDtoBuilder().withKind("cci").build();
        const conventionToSync = new ConventionDtoBuilder()
          .withAgencyId(agencyCCI.id)
          .build();
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyCCI)];
        uow.conventionRepository.setConventions([conventionToSync]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [conventionToSync]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync.id,
            status: "SKIP",
            processDate: timeGateway.now(),
            reason: "Agency is not of kind pole-emploi",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {
            [conventionToSync.id]: "Agency is not of kind pole-emploi",
          },
          errors: {},
        });
      });

      it("only process convention with status TO_PROCESS and ERROR", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionRepository.setConventions([
          conventionToSync1,
          conventionToSync2,
          conventionToSync3,
          conventionToSync4,
        ]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
          {
            id: conventionToSync2.id,
            status: "ERROR",
            processDate: subDays(timeGateway.now(), 1),
            reason: "Random error",
          },
          {
            id: conventionToSync3.id,
            status: "SKIP",
            processDate: subDays(timeGateway.now(), 1),
            reason: "Feature flag enablePeConventionBroadcast not enabled",
          },
          {
            id: conventionToSync4.id,
            status: "SUCCESS",
            processDate: subDays(timeGateway.now(), 1),
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
          conventionToSync2,
          conventionToSync3,
          conventionToSync4,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync2.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync3.id,
            status: "SKIP",
            processDate: subDays(timeGateway.now(), 1),
            reason: "Feature flag enablePeConventionBroadcast not enabled",
          },
          {
            id: conventionToSync4.id,
            status: "SUCCESS",
            processDate: subDays(timeGateway.now(), 1),
          },
        ]);
        expectToEqual(ftGateway.broadcastParamsCalls, [
          {
            eventType: "CONVENTION_UPDATED",
            convention: {
              ...conventionToSync1,
              agencyName: agencyFT.name,
              agencyDepartment: agencyFT.address.departmentCode,
              agencyKind: agencyFT.kind,
              agencySiret: agencyFT.agencySiret,
              agencyCounsellorEmails: [],
              agencyValidatorEmails: [],
            },
          },
          {
            eventType: "CONVENTION_UPDATED",
            convention: {
              ...conventionToSync2,
              agencyName: agencyFT.name,
              agencyDepartment: agencyFT.address.departmentCode,
              agencyKind: agencyFT.kind,
              agencySiret: agencyFT.agencySiret,
              agencyCounsellorEmails: [],
              agencyValidatorEmails: [],
            },
          },
        ]);
        expectToEqual(report, {
          success: 2,
          skips: {},
          errors: {},
        });
      });

      it("should consider limit", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionRepository.setConventions([
          conventionToSync1,
          conventionToSync2,
        ]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
          {
            id: conventionToSync2.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await new ResyncOldConventionsToFt(
          new InMemoryUowPerformer(uow),
          ftGateway,
          timeGateway,
          1,
        ).execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
          conventionToSync2,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "SUCCESS",
            processDate: timeGateway.now(),
          },
          {
            id: conventionToSync2.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.broadcastParamsCalls, [
          {
            eventType: "CONVENTION_UPDATED",
            convention: {
              ...conventionToSync1,
              agencyName: agencyFT.name,
              agencyDepartment: agencyFT.address.departmentCode,
              agencyKind: agencyFT.kind,
              agencySiret: agencyFT.agencySiret,
              agencyCounsellorEmails: [],
              agencyValidatorEmails: [],
            },
          },
        ]);
        expectToEqual(report, {
          success: 1,
          skips: {},
          errors: {},
        });
      });
    });

    describe("Wrong paths", () => {
      it("when no convention in conventionRepository should not sync convention", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agencyFT)];
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, []);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "ERROR",
            processDate: timeGateway.now(),
            reason: errors.convention.notFound({
              conventionId: conventionToSync1.id,
            }).message,
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {},
          errors: {
            [conventionToSync1.id]: errors.convention.notFound({
              conventionId: conventionToSync1.id,
            }),
          },
        });
      });

      it("when no agency", async () => {
        uow.conventionRepository.setConventions([conventionToSync1]);
        uow.conventionsToSyncRepository.setForTesting([
          {
            id: conventionToSync1.id,
            status: "TO_PROCESS",
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);

        const report = await useCase.execute();

        expectToEqual(uow.conventionRepository.conventions, [
          conventionToSync1,
        ]);
        expectToEqual(uow.conventionsToSyncRepository.conventionsToSync, [
          {
            id: conventionToSync1.id,
            status: "ERROR",
            processDate: timeGateway.now(),
            reason: errors.agency.notFound({ agencyId: agencyFT.id }).message,
          },
        ]);
        expectToEqual(ftGateway.legacyBroadcastConventionCalls, []);
        expectToEqual(report, {
          success: 0,
          skips: {},
          errors: {
            [conventionToSync1.id]: errors.agency.notFound({
              agencyId: agencyFT.id,
            }),
          },
        });
      });
    });
  });
});

function conventionToConventionNotification(
  convention: ConventionDto,
  agency: AgencyDto,
): FranceTravailConvention {
  return {
    id: "no-external-id",
    originalId: convention.id,
    peConnectId: convention.signatories.beneficiary.federatedIdentity?.token,
    statut: conventionStatusToFranceTravailStatus[convention.status],
    email: convention.signatories.beneficiary.email,
    telephone: convention.signatories.beneficiary.phone,
    prenom: convention.signatories.beneficiary.firstName,
    nom: convention.signatories.beneficiary.lastName,
    dateNaissance: new Date(
      convention.signatories.beneficiary.birthdate,
    ).toISOString(),
    dateDemande: new Date(convention.dateSubmission).toISOString(),
    dateDebut: new Date(convention.dateStart).toISOString(),
    dateFin: new Date(convention.dateEnd).toISOString(),
    dureeImmersion: convention.schedule.totalHours,
    raisonSociale: convention.businessName,
    siret: convention.siret,
    nomPrenomFonctionTuteur: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName} ${convention.establishmentTutor.job}`,
    telephoneTuteur: convention.establishmentTutor.phone,
    emailTuteur: convention.establishmentTutor.email,
    adresseImmersion: convention.immersionAddress,
    protectionIndividuelle: convention.individualProtection,
    preventionSanitaire: convention.sanitaryPrevention,
    descriptionPreventionSanitaire: convention.sanitaryPreventionDescription,
    objectifDeImmersion: 2,
    codeRome: convention.immersionAppellation.romeCode,
    codeAppellation: convention.immersionAppellation.appellationCode.padStart(
      6,
      "0",
    ),
    activitesObservees: convention.immersionActivities,
    competencesObservees: convention.immersionSkills,
    signatureBeneficiaire: !!convention.signatories.beneficiary.signedAt,
    signatureEntreprise:
      !!convention.signatories.establishmentRepresentative.signedAt,
    typeAgence: agency.kind === "pole-emploi" ? "france-travail" : agency.kind,
    nomAgence: agency.name,
    prenomValidateurRenseigne:
      convention.validators?.agencyValidator?.firstname,
    nomValidateurRenseigne: convention.validators?.agencyValidator?.lastname,
    rqth: "N",
    prenomTuteur: convention.establishmentTutor.firstName,
    nomTuteur: convention.establishmentTutor.lastName,
    fonctionTuteur: convention.establishmentTutor.job,
  };
}

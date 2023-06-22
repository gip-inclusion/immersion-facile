import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryPoleEmploiGateway } from "../../../adapters/secondary/poleEmploi/InMemoryPoleEmploiGateway";
import {
  conventionStatusToPoleEmploiStatus,
  PoleEmploiConvention,
} from "../ports/PoleEmploiGateway";
import { ResyncOldConventionToPe } from "./ResyncOldConventionsToPe";

describe("RenewConventionMagicLink use case", () => {
  const agencyPE = new AgencyDtoBuilder().withKind("pole-emploi").build();
  const conventionToSync1 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08b")
    .withAgencyId(agencyPE.id)
    .build();
  const conventionToSync2 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08a")
    .withAgencyId(agencyPE.id)
    .build();
  const conventionToSync3 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08d")
    .withAgencyId(agencyPE.id)
    .build();
  const conventionToSync4 = new ConventionDtoBuilder()
    .withId("6f59c7b7-c2c9-4a31-a3eb-377ea83ae08e")
    .withAgencyId(agencyPE.id)
    .build();

  let uow: InMemoryUnitOfWork;
  let useCase: ResyncOldConventionToPe;
  let timeGateway: CustomTimeGateway;
  let peGateway: InMemoryPoleEmploiGateway;

  beforeEach(() => {
    uow = createInMemoryUow();

    timeGateway = new CustomTimeGateway();
    peGateway = new InMemoryPoleEmploiGateway();
    useCase = new ResyncOldConventionToPe(
      new InMemoryUowPerformer(uow),
      peGateway,
      timeGateway,
      100,
    );
  });

  describe("Right paths", () => {
    it("broadcast two conventions to pe", async () => {
      uow.agencyRepository.setAgencies([agencyPE]);
      uow.conventionRepository.setConventions({
        [conventionToSync1.id]: conventionToSync1,
        [conventionToSync2.id]: conventionToSync2,
      });
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync1.id,
          status: "TO_PROCESS",
        },
        {
          id: conventionToSync2.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, [
        conventionToSync1,
        conventionToSync2,
      ]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
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
      expectToEqual(peGateway.notifications, [
        conventionToConventionNotification(conventionToSync1),
        conventionToConventionNotification(conventionToSync2),
      ]);
      expectToEqual(report, {
        success: 2,
        skips: {},
        errors: {},
      });
    });
    it("broadcast one convention to pe", async () => {
      uow.agencyRepository.setAgencies([agencyPE]);
      uow.conventionRepository.setConventions({
        [conventionToSync1.id]: conventionToSync1,
      });
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync1.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, [conventionToSync1]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
        {
          id: conventionToSync1.id,
          status: "SUCCESS",
          processDate: timeGateway.now(),
        },
      ]);
      expectToEqual(peGateway.notifications, [
        conventionToConventionNotification(conventionToSync1),
      ]);
      expectToEqual(report, {
        success: [conventionToSync1.id].length,
        skips: {},
        errors: {},
      });
    });
    it("no convention to sync", async () => {
      uow.conventionToSyncRepository.setForTesting([]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, []);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, []);
      expectToEqual(peGateway.notifications, []);
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
      uow.agencyRepository.setAgencies([agencyCCI]);
      uow.conventionRepository.setConventions({
        [conventionToSync.id]: conventionToSync,
      });
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, [conventionToSync]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
        {
          id: conventionToSync.id,
          status: "SKIP",
          processDate: timeGateway.now(),
          reason: "Agency is not of kind pole-emploi",
        },
      ]);
      expectToEqual(peGateway.notifications, []);
      expectToEqual(report, {
        success: 0,
        skips: {
          [conventionToSync.id]: "Agency is not of kind pole-emploi",
        },
        errors: {},
      });
    });
    it("when feature flag enablePeConventionBroadcast is disabled", async () => {
      await uow.featureFlagRepository.set({
        flagName: "enablePeConventionBroadcast",
        value: false,
      });
      uow.agencyRepository.setAgencies([agencyPE]);
      uow.conventionRepository.setConventions({
        [conventionToSync1.id]: conventionToSync1,
      });
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync1.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, [conventionToSync1]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
        {
          id: conventionToSync1.id,
          status: "SKIP",
          processDate: timeGateway.now(),
          reason: "Feature flag enablePeConventionBroadcast not enabled",
        },
      ]);
      expectToEqual(peGateway.notifications, []);
      expectToEqual(report, {
        success: 0,
        skips: {
          [conventionToSync1.id]:
            "Feature flag enablePeConventionBroadcast not enabled",
        },
        errors: {},
      });
    });
    it("only process convention with status TO_PROCESS and ERROR", async () => {
      uow.agencyRepository.setAgencies([agencyPE]);
      uow.conventionRepository.setConventions({
        [conventionToSync1.id]: conventionToSync1,
        [conventionToSync2.id]: conventionToSync2,
        [conventionToSync3.id]: conventionToSync3,
        [conventionToSync4.id]: conventionToSync4,
      });
      uow.conventionToSyncRepository.setForTesting([
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
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, [
        conventionToSync1,
        conventionToSync2,
        conventionToSync3,
        conventionToSync4,
      ]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
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
      expectToEqual(peGateway.notifications, [
        conventionToConventionNotification(conventionToSync1),
        conventionToConventionNotification(conventionToSync2),
      ]);
      expectToEqual(report, {
        success: 2,
        skips: {},
        errors: {},
      });
    });
    it("should consider limit", async () => {
      uow.agencyRepository.setAgencies([agencyPE]);
      uow.conventionRepository.setConventions({
        [conventionToSync1.id]: conventionToSync1,
        [conventionToSync2.id]: conventionToSync2,
      });
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync1.id,
          status: "TO_PROCESS",
        },
        {
          id: conventionToSync2.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await new ResyncOldConventionToPe(
        new InMemoryUowPerformer(uow),
        peGateway,
        timeGateway,
        1,
      ).execute();

      expectToEqual(uow.conventionRepository.conventions, [
        conventionToSync1,
        conventionToSync2,
      ]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
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
      expectToEqual(peGateway.notifications, [
        conventionToConventionNotification(conventionToSync1),
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
      uow.agencyRepository.setAgencies([agencyPE]);
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync1.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, []);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
        {
          id: conventionToSync1.id,
          status: "ERROR",
          processDate: timeGateway.now(),
          reason: `Convention with id ${conventionToSync1.id} missing in conventionRepository.`,
        },
      ]);
      expectToEqual(peGateway.notifications, []);
      expectToEqual(report, {
        success: 0,
        skips: {},
        errors: {
          [conventionToSync1.id]: new NotFoundError(
            `Convention with id ${conventionToSync1.id} missing in conventionRepository.`,
          ),
        },
      });
    });
    it("when no agency", async () => {
      uow.conventionRepository.setConventions({
        [conventionToSync1.id]: conventionToSync1,
      });
      uow.conventionToSyncRepository.setForTesting([
        {
          id: conventionToSync1.id,
          status: "TO_PROCESS",
        },
      ]);
      expectToEqual(peGateway.notifications, []);

      const report = await useCase.execute();

      expectToEqual(uow.conventionRepository.conventions, [conventionToSync1]);
      expectToEqual(uow.conventionToSyncRepository.conventionsToSync, [
        {
          id: conventionToSync1.id,
          status: "ERROR",
          processDate: timeGateway.now(),
          reason: `Agency with id ${agencyPE.id} missing in agencyRepository`,
        },
      ]);
      expectToEqual(peGateway.notifications, []);
      expectToEqual(report, {
        success: 0,
        skips: {},
        errors: {
          [conventionToSync1.id]: new NotFoundError(
            `Agency with id ${agencyPE.id} missing in agencyRepository`,
          ),
        },
      });
    });
  });
});

function conventionToConventionNotification(
  convention: ConventionDto,
): PoleEmploiConvention {
  return {
    id: convention.externalId
      ? convention.externalId.padStart(11, "0")
      : "no-external-id",
    originalId: convention.id,
    peConnectId: convention.signatories.beneficiary.federatedIdentity?.token,
    statut: conventionStatusToPoleEmploiStatus[convention.status],
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
  };
}

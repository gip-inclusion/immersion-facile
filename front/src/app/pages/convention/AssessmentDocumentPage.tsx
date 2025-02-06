import { fr } from "@codegouvfr/react-dsfr";
import React, { useEffect } from "react";
import { Document, Loader, MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  computeTotalHours,
  convertLocaleDateToUtcTimezoneDate,
  isStringDate,
  makeSiretDescriptionLink,
  toDisplayedDate,
} from "shared";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useJwt } from "src/app/hooks/jwt.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { assessmentSelectors } from "src/core-logic/domain/assessment/assessment.selectors";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { Route } from "type-route";
import logoIf from "/assets/img/logo-if.svg";
import logoRf from "/assets/img/logo-rf.svg";

type AssessmentDocumentPageProps = {
  route: Route<typeof routes.assessmentDocument>;
};

export const AssessmentDocumentPage = ({
  route,
}: AssessmentDocumentPageProps) => {
  const dispatch = useDispatch();
  const { jwt, jwtPayload } = useJwt(route);
  const conventionId = jwtPayload.applicationId;
  const assessment = useAppSelector(assessmentSelectors.currentAssessment);
  const isAssessmentLoading = useAppSelector(assessmentSelectors.isLoading);
  const { convention, isLoading: isConventionLoading } = useConvention({
    jwt,
    conventionId: jwtPayload.applicationId,
  });

  const logos = [
    <img key="logo-rf" src={logoRf} alt="Logo RF" />,
    <img key={"logo-if"} src={logoIf} alt="" />,
  ];

  useEffect(() => {
    dispatch(
      assessmentSlice.actions.getAssessmentRequested({
        conventionId,
        jwt,
        feedbackTopic: "assessment",
      }),
    );
  }, [dispatch, conventionId, jwt]);

  if (isConventionLoading || isAssessmentLoading) return <Loader />;
  if (!convention) return <p>Pas de convention correspondante trouvée</p>;
  if (!assessment) return <p>Pas de bilan correspondant trouvé</p>;

  return (
    <MainWrapper layout="default" vSpacing={8}>
      <Document
        logos={logos}
        title={`Bilan ${
          convention.internshipKind === "immersion"
            ? "de l'Immersion Professionelle"
            : "du mini-stage"
        } au sein de ${convention.businessName}`}
        customActions={[]}
      >
        <h2 className={fr.cx("fr-h4")}>
          Identifiant de la convention: {convention.id}
        </h2>
        <p>
          {convention.internshipKind === "immersion"
            ? "Cette immersion s'est déroulée"
            : "Ce mini-stage s'est déroulé"}{" "}
          du{" "}
          {toDisplayedDate({
            date: convertLocaleDateToUtcTimezoneDate(
              new Date(convention.dateStart),
            ),
          })}{" "}
          au{" "}
          {toDisplayedDate({
            date: convertLocaleDateToUtcTimezoneDate(
              new Date(convention.dateEnd),
            ),
          })}{" "}
          au sein de <strong>{convention.businessName}</strong> (Siret n° :{" "}
          <a
            href={makeSiretDescriptionLink(convention.siret)}
            target="_blank"
            rel="noreferrer"
          >
            {convention.siret}
          </a>
          ) à l'adresse suivante <strong>{convention.immersionAddress}</strong>.
        </p>
        <p>
          Métier observé : {convention.immersionAppellation.appellationLabel}.
        </p>
        <p>
          Objectif{" "}
          {convention.internshipKind === "immersion"
            ? "de l'immersion"
            : "du mini-stage"}{" "}
          : {convention.immersionObjective}.
        </p>
        <p>
          Le tuteur {convention.establishmentTutor.firstName}{" "}
          {convention.establishmentTutor.lastName} de{" "}
          {convention.signatories.beneficiary.firstName}{" "}
          {convention.signatories.beneficiary.lastName} a évalué son{" "}
          {convention.internshipKind === "immersion"
            ? "immersion"
            : "mini-stage"}
          .
        </p>
        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>
          Voici les informations saisies durant{" "}
          {convention.internshipKind === "immersion"
            ? "cette immersion"
            : "ce mini-stage"}{" "}
          :
        </h2>
        <ul>
          <li>
            {convention.internshipKind === "immersion"
              ? "L'immersion a-t-elle"
              : "Le mini-stage a-il"}{" "}
            eu lieu ? {assessment.status === "DID_NOT_SHOW" ? "Non" : "Oui"}
          </li>
          {assessment.status === "COMPLETED" && (
            <>
              <li>
                Nombre d'heures totales de l'immersion :{" "}
                {computeTotalHours({
                  convention,
                  assessmentStatus: assessment.status,
                  missedHours: 0,
                })}
              </li>
              <li>
                Date réelle de fin de l'immersion :{" "}
                {toDisplayedDate({
                  date: new Date(convention.dateEnd),
                  withHours: false,
                })}
              </li>
            </>
          )}
          {assessment.status === "PARTIALLY_COMPLETED" && (
            <>
              <li>
                Nombre d'heures totales de l'immersion :{" "}
                {computeTotalHours({
                  convention,
                  assessmentStatus: assessment.status,
                  missedHours:
                    assessment.status === "PARTIALLY_COMPLETED"
                      ? assessment.numberOfMissedHours
                      : 0,
                })}
              </li>
              <li>
                Date réelle de fin de l'immersion :{" "}
                {isStringDate(assessment.lastDayOfPresence ?? "")
                  ? toDisplayedDate({
                      date: new Date(assessment.lastDayOfPresence ?? ""),
                      withHours: false,
                    })
                  : "DATE INVALIDE"}
              </li>
            </>
          )}
        </ul>
        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>
          Résultats de{" "}
          {convention.internshipKind === "immersion"
            ? "l'immersion"
            : "du mini-stage"}{" "}
          :
        </h2>
        <ul>
          <li>Embauche ? {assessment.endedWithAJob ? "Oui" : "Non"}</li>
          {assessment.endedWithAJob && (
            <>
              <li>
                {toDisplayedDate({
                  date: convertLocaleDateToUtcTimezoneDate(
                    new Date(assessment.contractStartDate),
                  ),
                })}
              </li>
              <li>Type de contrat : {assessment.typeOfContract}</li>
            </>
          )}
        </ul>
        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Appréciation générale :</h2>
        <p>{assessment.establishmentFeedback}</p>
        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Conseils pour la suite :</h2>
        <p>{assessment.establishmentAdvices}</p>
        <hr className={fr.cx("fr-hr", "fr-mb-6w", "fr-mt-10w")} />
        <footer className={fr.cx("fr-text--xs")}>
          <p>
            Ce document a été rédigé dans le cadre{" "}
            {convention.internshipKind === "immersion"
              ? "de l'immersion professionelle réalisée"
              : "du mini-stage réalisé"}
            par {convention.signatories.beneficiary.firstName}{" "}
            {convention.signatories.beneficiary.lastName} chez{" "}
            {convention.businessName}. Il peut être utilisé comme référence lors
            de futurs entretiens ou dans le dossier de candidature pour
            valoriser l'expérience acquise au sein de l'entreprise d'accueil.
          </p>
          <p>
            Nous vous encourageons à conserver ce PDF comme preuve officielle de
            votre immersion et des compétences développées, en vue de vos
            futures candidatures.
          </p>
        </footer>
      </Document>
    </MainWrapper>
  );
};

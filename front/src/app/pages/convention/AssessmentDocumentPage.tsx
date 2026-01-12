import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { Document, Loader, MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AssessmentDto,
  computeTotalHours,
  convertLocaleDateToUtcTimezoneDate,
  domElementIds,
  escapeHtml,
  getFormattedFirstnameAndLastname,
  isStringDate,
  type LegacyAssessmentDto,
  makeSiretDescriptionLink,
  toDisplayedDate,
} from "shared";
import { useConvention } from "src/app/hooks/convention.hooks";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useJwt } from "src/app/hooks/jwt.hooks";
import { usePdfGenerator } from "src/app/hooks/pdf.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import type { routes } from "src/app/routes/routes";
import { assessmentSelectors } from "src/core-logic/domain/assessment/assessment.selectors";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import type { Route } from "type-route";
import logoIf from "/assets/img/logo-if.svg";
import logoRf from "/assets/img/logo-rf.svg";

type AssessmentDocumentPageProps = {
  route: Route<typeof routes.assessmentDocument>;
};

const isLegacyAssessment = (
  assessment: AssessmentDto | LegacyAssessmentDto,
): assessment is LegacyAssessmentDto => {
  return assessment.status === "FINISHED" || assessment.status === "ABANDONED";
};

export const AssessmentDocumentPage = ({
  route,
}: AssessmentDocumentPageProps) => {
  const dispatch = useDispatch();
  const { jwt, jwtPayload } = useJwt(route);

  const conventionId = jwtPayload.applicationId ?? route.params.conventionId;
  const assessment = useAppSelector(assessmentSelectors.currentAssessment);
  const isAssessmentLoading = useAppSelector(assessmentSelectors.isLoading);

  const { convention, isLoading: isConventionLoading } = useConvention({
    jwt,
    conventionId,
  });
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  const fetchConventionError =
    conventionFormFeedback?.level === "error" &&
    conventionFormFeedback.on === "fetch";
  const { isPdfLoading, generateAndDownloadPdf } = usePdfGenerator();

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

  if (isConventionLoading || isAssessmentLoading || isPdfLoading)
    return <Loader />;

  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={conventionFormFeedback?.message}
        jwt={jwt}
      />
    );
  if (!convention) return <p>Pas de convention correspondante trouvée</p>;
  if (!assessment) return <p>Pas de bilan correspondant trouvé</p>;

  const isAssessmentLegacy = isLegacyAssessment(assessment);

  return (
    <MainWrapper layout="default" vSpacing={8}>
      <Document
        logos={logos}
        printButtonLabel={"Imprimer le bilan"}
        title={`Bilan ${
          convention.internshipKind === "immersion"
            ? "de l'immersion professionnelle"
            : "du mini-stage"
        }`}
        beneficiaryName={getFormattedFirstnameAndLastname({
          firstname: convention.signatories.beneficiary.firstName,
          lastname: convention.signatories.beneficiary.lastName,
        })}
        businessName={convention.businessName}
        internshipKind={convention.internshipKind}
        customActions={[
          <Button
            key={"htmlToPdfButton"}
            priority="secondary"
            onClick={() =>
              generateAndDownloadPdf({
                conventionId,
                prefix: "bilan",
                jwt,
              })
            }
            className={fr.cx("fr-mr-1w")}
            id={domElementIds.assessmentDocument.downloadPdfButton}
          >
            Télécharger en PDF
          </Button>,
        ]}
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
        <ul>
          <li>
            <strong>Métier observé :</strong>{" "}
            {convention.immersionAppellation.appellationLabel}
          </li>
          <li>
            <strong>
              Objectif{" "}
              {convention.internshipKind === "immersion"
                ? "de l'immersion"
                : "du mini-stage"}{" "}
              :
            </strong>{" "}
            {convention.immersionObjective}
          </li>
        </ul>
        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>
          Évaluation du tuteur{" "}
          {convention.internshipKind === "immersion"
            ? "de l'immersion"
            : "du mini-stage"}
        </h2>
        <p>
          <strong>Tuteur :</strong>{" "}
          {getFormattedFirstnameAndLastname({
            firstname: convention.establishmentTutor.firstName,
            lastname: convention.establishmentTutor.lastName,
          })}
        </p>
        <ul>
          {!isAssessmentLegacy && (
            <li>
              <strong>
                {convention.internshipKind === "immersion"
                  ? "Immersion réalisée"
                  : "Mini-stage réalisé"}{" "}
                :
              </strong>{" "}
              {assessment.status === "DID_NOT_SHOW" ? "Non" : "Oui"}
            </li>
          )}
          {isAssessmentLegacy && (
            <li>
              <strong>
                {convention.internshipKind === "immersion"
                  ? "Immersion complète"
                  : "Mini-stage complet"}{" "}
                :
              </strong>{" "}
              {assessment.status === "ABANDONED" ? "Non" : "Oui"}
            </li>
          )}
          {assessment.status === "COMPLETED" && (
            <>
              <li>
                <strong>Nombre total d'heures :</strong>{" "}
                {computeTotalHours({
                  convention,
                  numberOfMissedHours: 0,
                  lastDayOfPresence: undefined,
                  status: assessment.status,
                })}
              </li>
              <li>
                <strong>Date réelle de fin :</strong>{" "}
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
                <strong>Nombre total d'heures :</strong>{" "}
                {computeTotalHours({
                  convention,
                  numberOfMissedHours: assessment.numberOfMissedHours,
                  lastDayOfPresence: assessment.lastDayOfPresence,
                  status: assessment.status,
                })}
              </li>
              <li>
                <strong>Date réelle de fin :</strong>{" "}
                {isStringDate(assessment.lastDayOfPresence ?? "")
                  ? toDisplayedDate({
                      date: new Date(assessment.lastDayOfPresence ?? ""),
                      withHours: false,
                    })
                  : "DATE INVALIDE"}
              </li>
            </>
          )}
          {!isAssessmentLegacy && (
            <>
              <li>
                <strong>Embauche :</strong>{" "}
                {assessment.endedWithAJob ? "Oui" : "Non"}
              </li>
              {assessment.endedWithAJob && (
                <>
                  <li>
                    <strong>Date d'embauche :</strong>{" "}
                    {toDisplayedDate({
                      date: convertLocaleDateToUtcTimezoneDate(
                        new Date(assessment.contractStartDate),
                      ),
                    })}
                  </li>
                  <li>
                    <strong>Type de contrat :</strong>{" "}
                    {assessment.typeOfContract}
                  </li>
                </>
              )}
            </>
          )}
        </ul>
        <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Appréciation générale :</h2>
        <p
          dangerouslySetInnerHTML={{
            __html: escapeHtml(assessment.establishmentFeedback).replace(
              /\n/g,
              "<br />",
            ),
          }}
        />
        {!isAssessmentLegacy && (
          <>
            <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>
              Conseils pour la suite :
            </h2>
            <p
              dangerouslySetInnerHTML={{
                __html: escapeHtml(assessment.establishmentAdvices).replace(
                  /\n/g,
                  "<br />",
                ),
              }}
            />
          </>
        )}
        <hr className={fr.cx("fr-hr", "fr-mb-6w", "fr-mt-10w")} />
        <footer className={fr.cx("fr-text--xs")}>
          <p>
            Ce document a été rédigé dans le cadre{" "}
            {convention.internshipKind === "immersion"
              ? "de l'immersion professionnelle réalisée"
              : "du mini-stage réalisé"}{" "}
            par{" "}
            {getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
              firstname: convention.signatories.beneficiary.firstName,
            })}{" "}
            chez {convention.businessName}. Il peut être utilisé comme référence
            lors de futurs entretiens ou dans le dossier de candidature pour
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

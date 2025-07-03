import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { HeadingSection, SectionHighlight } from "react-design-system";
import type {
  AgencyRight,
  ConnectedUserJwt,
  WithAgencyDashboards,
  WithEstablishmentDashboards,
} from "shared";
import { MarkPartnersErroredConventionAsHandledFormSection } from "src/app/pages/agency-dashboard/MarkPartnersErroredConventionAsHandledFormSection";
import { MetabaseView } from "../../../MetabaseView";

export const ErroredConventionTabContent = ({
  activeAgencyRights,
  connectedUserJwt,
  dashboards,
}: {
  activeAgencyRights: AgencyRight[];
  connectedUserJwt: ConnectedUserJwt | undefined;
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards;
}) => {
  const isUserHaveFtAgencyRight = activeAgencyRights.some(
    (agencyRight) => agencyRight.agency.kind === "pole-emploi",
  );

  return (
    <>
      {connectedUserJwt ? (
        <MarkPartnersErroredConventionAsHandledFormSection
          jwt={connectedUserJwt}
          isPeUser={isUserHaveFtAgencyRight}
        />
      ) : (
        <Alert
          severity="error"
          title="Non autorisé"
          description="Cette page est reservée aux utilisateurs connectés avec Inclusion Connect, et dont l'organisme est responsable de cette convention."
        />
      )}
      <MetabaseView
        title="Tableau de bord agence"
        url={dashboards.agencies.erroredConventionsDashboardUrl}
      />
      {isUserHaveFtAgencyRight && (
        <div className={fr.cx("fr-mt-4w")}>
          <SectionHighlight>
            <HeadingSection title="Comment prévenir les erreurs :" titleAs="h2">
              <h3 className={fr.cx("fr-h6")}>
                Identifiant National DE trouvé mais écart sur la date de
                naissance
              </h3>
              <p>
                Action → Modifier la date de naissance dans la demande pour
                correspondre à l'information présente dans le dossier du
                Demandeur d'emploi
              </p>

              <h3 className={fr.cx("fr-h6")}>
                Identifiant National DE non trouvé
              </h3>
              <p>
                Action → Soit le mail utilisé chez Immersion Facilitée est
                différent de celui du dossier du Demandeur d'emploi. Dans ce
                cas, modifier l'email dans le dossier du Demandeur d'emploi
                avant validation et avec son accord.
              </p>
              <p>
                Action → Soit le candidat n'est pas inscrit. Dans ce cas,
                procéder à l'inscription ou réinscription avant la validation .
              </p>
            </HeadingSection>
          </SectionHighlight>
        </div>
      )}
    </>
  );
};

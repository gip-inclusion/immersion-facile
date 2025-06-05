import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { Fragment } from "react";
import {
  type AgencyDtoForAgencyUsersAndAdmins,
  addressDtoToString,
  agencyKindToLabelIncludingIF,
} from "shared";
import { HeadingSection } from "src/app/components/layout/HeadingSection";
import { routes } from "src/app/routes/routes";
import { AgencyStatusBadge } from "../../AgencyStatusBadge";
import { AgencyTag } from "../../AgencyTag";

export const AgencyAdminTabContent = ({
  agenciesUserIsAdminOn,
}: {
  agenciesUserIsAdminOn: AgencyDtoForAgencyUsersAndAdmins[];
}) => (
  <HeadingSection
    className={fr.cx("fr-mt-0")}
    title="Mes Organismes"
    titleAs="h2"
    description={`Organismes sur lesquels vous êtes administrateur (${agenciesUserIsAdminOn.length} organismes)`}
  >
    <Table
      headers={["Nom de l'organisme", "Type d'organisme", "Actions"]}
      data={agenciesUserIsAdminOn.map(AdminAgencyLine)}
    />
  </HeadingSection>
);

const AdminAgencyLine = (agency: AgencyDtoForAgencyUsersAndAdmins) => [
  <Fragment key={`${agency.id}-agency-infos`}>
    <AgencyTag refersToAgencyName={agency.refersToAgencyName} />
    <AgencyStatusBadge status={agency.status} />
    <br />
    <span>{agency.name}</span>
    <br />
    <span className={fr.cx("fr-hint-text")}>
      {addressDtoToString(agency.address)}
    </span>
  </Fragment>,
  agencyKindToLabelIncludingIF[agency.kind],

  <Button
    key={`${agency.id}-see-agency-link`}
    {...routes.agencyDashboardAgencyDetails({
      agencyId: agency.id,
    })}
    size="small"
    priority="tertiary"
    iconId="fr-icon-arrow-right-line"
  >
    Voir l'organisme
  </Button>,
];

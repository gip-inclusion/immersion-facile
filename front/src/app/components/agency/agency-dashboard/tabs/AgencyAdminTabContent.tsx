import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";
import { Fragment } from "react";
import {
  type AgencyDtoForAgencyUsersAndAdmins,
  addressDtoToString,
  agencyKindToLabelIncludingIF,
} from "shared";
import { routes } from "src/app/routes/routes";
import { AgencyStatusBadge } from "../../AgencyStatusBadge";
import { AgencyTag } from "../../AgencyTag";

export const AgencyAdminTabContent = (
  agenciesUserIsAdminOn: AgencyDtoForAgencyUsersAndAdmins[],
) => (
  <>
    <p className={fr.cx("fr-text--bold")}>
      Organismes sur lesquels vous êtes administrateur (
      {agenciesUserIsAdminOn.length} organismes)
    </p>

    <Table
      headers={["Nom de l'organisme", "Type d'organisme", "Actions"]}
      data={agenciesUserIsAdminOn.map(AdminAgencyLine)}
    />
  </>
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

  <a
    key={`${agency.id}-see-agency-link`}
    {...routes.agencyDashboardAgencyDetails({
      agencyId: agency.id,
    })}
  >
    Voir l'organisme
  </a>,
];

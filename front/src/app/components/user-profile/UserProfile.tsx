import { fr } from "@codegouvfr/react-dsfr";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import type { ConnectedUser } from "shared";
import { AgenciesTablesSection } from "../agency/agencies-table/AgenciesTablesSection";
import { EstablishmentsTablesSection } from "../establishment/establishments-table/EstablishmentsTablesSection";
import { PersonnalInformationsSection } from "./PersonnalInformationsSection";

type UserProfileProps = {
  title: string;
  userWithRights: ConnectedUser;
  editInformationsLink?: string;
};

export const UserProfile = ({
  title,
  userWithRights,
  editInformationsLink,
}: UserProfileProps) => (
  <div>
    <div className={fr.cx("fr-grid-row")}>
      <h1 className={fr.cx("fr-col-12", "fr-col-md")}>{title}</h1>
    </div>
    <PersonnalInformationsSection
      user={userWithRights}
      editInformationsLink={editInformationsLink}
    />
    <Tabs
      tabs={[
        {
          label: `Organismes (${userWithRights.agencyRights.length})`,
          content: (
            <AgenciesTablesSection
              user={userWithRights}
              agencyRights={userWithRights.agencyRights}
              isBackofficeAdmin={userWithRights.isBackofficeAdmin}
            />
          ),
        },
        {
          label: `Entreprises (${userWithRights.establishments ? userWithRights.establishments.length : 0})`,
          content: (
            <EstablishmentsTablesSection
              withEstablishmentData={userWithRights.establishments}
            />
          ),
        },
      ]}
    />
  </div>
);

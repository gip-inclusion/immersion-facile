import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";

import { type ConnectedUser, domElementIds } from "shared";
import { routes } from "src/app/routes/routes";
import { AgenciesTablesSection } from "../agency/agencies-table/AgenciesTablesSection";
import { EstablishmentsTablesSection } from "../establishment/establishments-table/EstablishmentsTablesSection";
import { PersonnalInformationsSection } from "./PersonnalInformationsSection";

type UserProfileProps = {
  title: string;
  currentUser: ConnectedUser;
  userWithRights: ConnectedUser;
  editInformationsLink?: string;
};

export const UserProfile = ({
  title,
  currentUser,
  userWithRights,
  editInformationsLink,
}: UserProfileProps) => (
  <div>
    <div className={fr.cx("fr-grid-row")}>
      <h1 className={fr.cx("fr-col-12", "fr-col-md")}>{title}</h1>
      <div className={fr.cx("fr-ml-md-auto")}>
        <Button
          id={domElementIds.profile.registerAgenciesSearchLink}
          priority="secondary"
          linkProps={{
            href: `${routes.myProfileAgencyRegistration().href}`,
          }}
        >
          {currentUser.agencyRights.length > 0
            ? "Demander l'accès à d'autres organismes"
            : "Demander l'accès à des organismes"}
        </Button>
      </div>
    </div>
    <PersonnalInformationsSection
      user={userWithRights}
      editInformationsLink={editInformationsLink}
    />
    <AgenciesTablesSection
      user={userWithRights}
      agencyRights={userWithRights.agencyRights}
      isBackofficeAdmin={currentUser.isBackofficeAdmin}
    />
    <EstablishmentsTablesSection
      withEstablishmentData={userWithRights.establishments}
    />
  </div>
);

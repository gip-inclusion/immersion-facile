import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";

import {
  type InclusionConnectedUser,
  type UserParamsForAgency,
  domElementIds,
} from "shared";
import { routes } from "src/app/routes/routes";
import { AgenciesTablesSection } from "../agency/agencies-table/AgenciesTablesSection";
import { EstablishmentsTablesSection } from "../establishment/establishments-table/EstablishmentsTablesSection";
import { PersonnalInformationsSection } from "./PersonnalInformationsSection";

type UserProfileProps = {
  title: string;
  currentUser: InclusionConnectedUser;
  userWithRights: InclusionConnectedUser;
  editInformationsLink?: string;
  onUserUpdateRequested: (userParamsForAgency: UserParamsForAgency) => void;
};

export const UserProfile = ({
  title,
  currentUser,
  userWithRights,
  editInformationsLink,
  onUserUpdateRequested,
}: UserProfileProps) => (
  <div>
    <div className={fr.cx("fr-grid-row")}>
      <h1 className={fr.cx("fr-col-12", "fr-col-sm-10")}>{title}</h1>
      <Button
        id={domElementIds.profile.registerAgenciesSearchLink}
        priority="secondary"
        className={fr.cx("fr-col-12", "fr-col-sm-2")}
        linkProps={{
          href: `${routes.myProfileAgencyRegistration().href}`,
        }}
      >
        {currentUser.agencyRights.length > 0
          ? "Demander l'accès à d'autres organismes"
          : "Demander l'accès à des organismes"}
      </Button>
    </div>
    <PersonnalInformationsSection
      user={userWithRights}
      editInformationsLink={editInformationsLink}
    />
    <AgenciesTablesSection
      user={userWithRights}
      agencyRights={userWithRights.agencyRights}
      isBackofficeAdmin={currentUser.isBackofficeAdmin}
      onUserUpdateRequested={onUserUpdateRequested}
    />
    <EstablishmentsTablesSection
      withEstablishmentData={userWithRights.establishments}
    />
  </div>
);

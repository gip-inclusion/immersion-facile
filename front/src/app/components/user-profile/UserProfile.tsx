import React from "react";
import { InclusionConnectedUser, UserParamsForAgency } from "shared";
import { AgenciesTablesSection } from "./AgenciesTablesSection";
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
    <h1>{title}</h1>
    <PersonnalInformationsSection
      user={userWithRights}
      editInformationsLink={editInformationsLink}
    />
    <AgenciesTablesSection
      user={userWithRights}
      agencyRights={[...userWithRights.agencyRights]}
      isBackofficeAdmin={currentUser.isBackofficeAdmin}
      onUserUpdateRequested={onUserUpdateRequested}
    />
  </div>
);

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { AgencyId, AgencyRole, Email, UserId, keys } from "shared";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { Feedback } from "../feedback/Feedback";
import { agencyRoleToDisplay } from "./AgencyUsers";

const manageUserModal = createModal({
  isOpenedByDefault: false,
  id: "im-manage-user-modal",
});

type ManageUserModalProps = {
  userId: UserId;
  userEmail: Email;
  userRole: AgencyRole[];
  agencyId: AgencyId;
};

export const ManageUserModal = ({
  userId,
  userEmail,
  userRole,
  agencyId,
}: ManageUserModalProps): JSX.Element => {
  const dispatch = useDispatch();

  const [rolesSelected, setRolesSelected] = useState<AgencyRole[]>(userRole);

  const checkboxOptions = keys(agencyRoleToDisplay).map((roleKey, index) => {
    return {
      label: agencyRoleToDisplay[roleKey].label,
      nativeInputProps: {
        name: `role ${index}`,
        value: roleKey,
        checked: rolesSelected.includes(roleKey),
        onChange: () => {
          setRolesSelected((roleSelectedList) =>
            roleSelectedList.includes(roleKey)
              ? roleSelectedList.filter((r) => r !== roleKey)
              : [...roleSelectedList, roleKey],
          );
        },
      },
    };
  });

  return (
    <>
      <Button
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          manageUserModal.open();
        }}
      >
        Modifier
      </Button>
      {createPortal(
        <manageUserModal.Component title="Modifier le rôle de l'utilisateur">
          <div className={fr.cx("fr-mb-2w", "fr-mt-1v")}>
            Utilisateur : {userEmail}
          </div>

          <Checkbox
            orientation="horizontal"
            legend="Rôles :"
            options={checkboxOptions}
          />

          <Feedback topic="update-agency-user" />

          <Button
            onClick={() => {
              dispatch(
                icUsersAdminSlice.actions.updateUserOnAgencyRequested({
                  userId,
                  agencyId,
                  roles: rolesSelected,
                  feedbackTopic: "update-agency-user",
                }),
              );
            }}
          >
            Valider
          </Button>
        </manageUserModal.Component>,
        document.body,
      )}
    </>
  );
};

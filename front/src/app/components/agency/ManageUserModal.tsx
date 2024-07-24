import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { createPortal } from "react-dom";
import { NormalizedIcUserById } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { agencyRoleToDisplay } from "./AgencyUsers";

const manageUserModal = createModal({
  isOpenedByDefault: false,
  id: "im-manage-user-modal",
});

export const ManageUserModal = (
  agencyUser: NormalizedIcUserById,
): JSX.Element => {
  const checkboxOptions = Object.values(agencyRoleToDisplay).map(
    (role, index) => {
      return {
        label: role,
        nativeInputProps: {
          name: `role ${index}`,
          value: role,
          // checked: true,
          // onChange: () => {}
        },
      };
    },
  );
  return (
    <>
      <Button
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log(agencyUser.agencyUser.email);
          manageUserModal.open();
        }}
      >
        Modifier
      </Button>
      {createPortal(
        <manageUserModal.Component title="Modifier le rôle de l'utilisateur">
          <div className={fr.cx("fr-mb-2w", "fr-mt-1v")}>
            Utilisateur : {agencyUser.agencyUser.email}
          </div>

          <Checkbox
            orientation="horizontal"
            legend="Rôles :"
            options={checkboxOptions}
          />
        </manageUserModal.Component>,
        document.body,
      )}
    </>
  );
};

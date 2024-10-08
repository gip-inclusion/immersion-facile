import { fr } from "@codegouvfr/react-dsfr";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React, { ElementRef } from "react";
import { useDispatch } from "react-redux";
import { domElementIds } from "shared";
import { NameAndEmailInTable } from "src/app/components/admin/NameAndEmailInTable";
import { SomeUsersWithoutName } from "src/app/components/agency/SomeUsersWithoutName";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { listUsersSelectors } from "src/core-logic/domain/admin/listUsers/listUsers.selectors";
import { listUsersSlice } from "src/core-logic/domain/admin/listUsers/listUsers.slice";

export const UsersTab = () => {
  const dispatch = useDispatch();
  const query = useAppSelector(listUsersSelectors.query);

  const inputElement = React.useRef<ElementRef<"input">>(null);

  return (
    <>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
        <div className={fr.cx("fr-col-lg-6")}>
          <h5 className={fr.cx("fr-h5", "fr-mb-0", "fr-mt-0")}>Utilisateurs</h5>
          <SomeUsersWithoutName />
        </div>
        <div className={fr.cx("fr-col-lg-6")}>
          <SearchBar
            renderInput={({ className, id, placeholder, type }) => (
              <input
                ref={inputElement}
                className={className}
                id={id}
                placeholder={placeholder}
                type={type}
                value={query}
                // Note: The default behavior for an input of type 'text' is to clear the input value when the escape key is pressed.
                // However, due to a bug in @gouvfr/dsfr the escape key event is not propagated to the input element.
                // As a result this onChange is not called when the escape key is pressed.
                onChange={(event) =>
                  dispatch(
                    listUsersSlice.actions.queryUpdated(
                      event.currentTarget.value,
                    ),
                  )
                }
                // Same goes for the keydown event so this is useless but we hope the bug will be fixed soon.
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    inputElement.current?.blur();
                  }
                }}
              />
            )}
          />
        </div>
      </div>
      <UsersTable />
    </>
  );
};

const UsersTable = () => {
  const isFetching = useAppSelector(listUsersSelectors.isFetching);
  const users = useAppSelector(listUsersSelectors.users);

  if (isFetching) return <p>Chargement en cours...</p>;
  if (users.length === 0)
    return <p>Aucun utilisateur correspondant à votre recherche</p>;

  return (
    <Table
      fixed
      id={domElementIds.admin.usersTab.usersTable}
      headers={["Utilisateur", "Nombre d'agence liées"]}
      data={users.map((user) => [
        <NameAndEmailInTable
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
        />,
        user.numberOfAgencies,
      ])}
    />
  );
};

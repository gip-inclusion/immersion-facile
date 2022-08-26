import React, { ChangeEvent, useEffect, useState } from "react";
import { conventionGateway } from "src/app/config/dependencies";
import { frontRoutes } from "shared/src/routes";
import { allRoles, Role } from "shared/src/tokens/MagicLinkPayload";
import { useAdminToken } from "src/hooks/useAdminToken";
import { ConventionFormAccordionProps } from "./ConventionFormAccordion";
import { WithBackground } from "src/uiComponents/admin/WithBackground";

// Component to show the magic links picker
export const FormMagicLinks = ({
  convention,
}: ConventionFormAccordionProps) => {
  const adminToken = useAdminToken();
  const [role, setRole] = useState(allRoles[0]);
  const [route, setRoute] = useState(
    Object.keys(frontRoutes)[0] as keyof typeof frontRoutes,
  );
  const [link, setLink] = useState(undefined as string | undefined);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    conventionGateway
      .generateMagicLink(adminToken, convention.id, role, expired)
      .then(
        (jwt) =>
          `${location.protocol}//${location.host}/${frontRoutes[route]}/?jwt=${jwt}`,
      )
      .then(setLink);
  }, [role, route, expired]);

  const handleRolesDropdownChange = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    setLink(undefined);
    setRole(target.value as Role);
  };

  const handleRouteDropdownChange = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    setLink(undefined);
    setRoute(target.value as keyof typeof frontRoutes);
  };

  return (
    <>
      <WithBackground>
        <div className="flex justify-evenly">
          <select
            className="fr-select"
            id="roles-dropdown"
            name="select"
            key="roles-dropdown"
            onChange={handleRolesDropdownChange}
            style={{ width: "190px" }}>
            {allRoles.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            className="fr-select"
            id="routes-dropdown"
            name="select"
            key="routes-dropdown"
            onChange={handleRouteDropdownChange}
            style={{ width: "330px" }}>
            {Object.keys(frontRoutes).map((route) => (
              <option value={route} key={route}>
                {route}
              </option>
            ))}
          </select>

          <label>
            <input
              type="checkbox"
              checked={expired}
              onChange={() => {
                setExpired(!expired);
              }}
              style={{ appearance: "checkbox" }}
            />
            Expired
          </label>

          {!link && <p>⌛️ generating... </p>}

          {link && <a href={link}>Lien Magique</a>}
        </div>
      </WithBackground>
    </>
  );
};

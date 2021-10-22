import React, { ChangeEvent, useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/main";
import { frontRoutes } from "src/shared/routes";
import { allRoles, Role } from "src/shared/tokens/MagicLinkPayload";
import { FormAccordionProps } from "./FormAccordion";

// Component to show the magic links picker
export const FormMagicLinks = ({
  immersionApplication,
}: FormAccordionProps) => {
  const [role, setRole] = useState(allRoles[0]);
  const [route, setRoute] = useState(
    Object.keys(frontRoutes)[0] as keyof typeof frontRoutes,
  );
  const [link, setLink] = useState(undefined as string | undefined);

  useEffect(() => {
    immersionApplicationGateway
      .generateMagicLink(immersionApplication.id, role)
      .then((jwt) => {
        return (
          location.protocol +
          "//" +
          location.host +
          "/" +
          frontRoutes[route] +
          "/?jwt=" +
          jwt
        );
      })
      .then(setLink);
  }, [role, route]);

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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "30px",
          backgroundColor: "#E5E5F4",
          padding: "10px",
        }}
      >
        <select
          className="fr-select"
          id="roles-dropdown"
          name="select"
          key="roles-dropdown"
          onChange={handleRolesDropdownChange}
          style={{ width: "190px" }}
        >
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
          style={{ width: "330px" }}
        >
          {Object.keys(frontRoutes).map((route) => (
            <option value={route} key={route}>
              {route}
            </option>
          ))}
        </select>

        {!link && <p>⌛️ generating... </p>}

        {link && <a href={link}>Lien Magique</a>}
      </div>
    </>
  );
};

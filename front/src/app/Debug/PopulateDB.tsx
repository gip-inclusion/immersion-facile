import React, { useEffect, useState } from "react";
import { routes } from "src/app/routes";
import { Route } from "type-route";
import { immersionApplicationGateway } from "../main";

interface PopulateDBProps {
  route: Route<typeof routes.debugPopulateDB>;
}

export const PopulateDB = ({ route }: PopulateDBProps) => {
  const [status, setStatus] = useState("executing");
  useEffect(() => {
    immersionApplicationGateway
      .debugPopulateDB(route.params.count)
      .then((strings: Array<string>) => {
        setStatus(`Complete. Populated:\n ${strings.join("\n")}`);
      })
      .catch((e) => {
        setStatus(e.toString());
      });
  }, []);

  return <div style={{ whiteSpace: "pre-line" }}>{status}</div>;
};

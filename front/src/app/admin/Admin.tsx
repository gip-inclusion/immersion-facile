import React, { Component, useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/main";
import { routes } from "src/app/routes";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { MarianneHeader } from "src/components/MarianneHeader";
import { Route } from "type-route";
import "./Admin.css";
import { FormAccordion } from "src/components/admin/FormAccordion";

interface AdminState {
  demandeImmersion: Array<ImmersionApplicationDto>;
}
interface AdminProps {
  route: Route<typeof routes.admin>;
}

export const Admin = ({ route }: AdminProps) => {
  const [demandesImmersion, setDemandesImmersion] = useState<
    ImmersionApplicationDto[]
  >([]);

  useEffect(() => {
    immersionApplicationGateway.getAll().then(setDemandesImmersion);
  }, []);

  return (
    <>
      <MarianneHeader />

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w" style={{ width: "95%" }}>
          <h2>Backoffice</h2>
          <div className="fr-text">
            Bienvenue dans le backoffice ! <br />
            Veuillez autentifier pour acceder aux donnes. <br />
          </div>

          <ul className="fr-accordions-group">
            {demandesImmersion.map((item) => (
              <li key={item.id}>
                <FormAccordion immersionApplication={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

import React, { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { routes } from "src/app/routes";
import { FormAccordion } from "src/components/admin/FormAccordion";
import { FormMagicLinks } from "src/components/admin/FormMagicLinks";
import { MarianneHeader } from "src/components/MarianneHeader";
import { AgencyId } from "src/shared/agencies";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { Route } from "type-route";
import "./Admin.css";

interface AdminState {
  demandeImmersion: Array<ImmersionApplicationDto>;
}
interface AdminProps {
  route: Route<typeof routes.admin> | Route<typeof routes.agencyAdmin>;
}

export const Admin = ({ route }: AdminProps) => {
  const [demandesImmersion, setDemandesImmersion] = useState<
    ImmersionApplicationDto[]
  >([]);

  useEffect(() => {
    let agency =
      "agencyId" in route.params
        ? (route.params.agencyId as AgencyId)
        : undefined;
    immersionApplicationGateway.getAll(agency).then(setDemandesImmersion);
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
                <FormMagicLinks immersionApplication={item} />
                <hr />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

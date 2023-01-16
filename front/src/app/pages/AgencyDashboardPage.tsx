import React from "react";

export const AgencyDashboardPage = () => (
  // the Layout (Header, Footer...) is given by InclusionConnectedPrivateRoute (higher order component)
  <div>
    Le tableau de bord de l'agence.
    <br />
    Cette page n'est visible que si l'utilisateur est Inclusion connecté.
  </div>
);

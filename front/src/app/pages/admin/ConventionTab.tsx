import React, { useEffect, useState } from "react";
import "./Admin.css";
import { MetabaseView } from "src/app/components/MetabaseView";
import { adminGateway } from "src/app/config/dependencies";
import { useAdminToken } from "src/hooks/useAdminToken";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";

export const ConventionTab = () => {
  const [url, setUrl] = useState<AbsoluteUrl | undefined>();
  const adminToken = useAdminToken();

  useEffect(() => {
    adminGateway.dashboardConvention(adminToken).subscribe(setUrl);
  });

  return (
    <>
      currentUrl: {url}
      <MetabaseView title="Gérer les conventions" url={url} />
    </>
  );
};

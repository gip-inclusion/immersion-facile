import React, { useEffect, useState } from "react";
import { AbsoluteUrl } from "shared";
import { MetabaseView } from "src/app/components/MetabaseView";
import { adminGateway } from "src/app/config/dependencies";
import { useAdminToken } from "src/hooks/useAdminToken";
import "./admin.css";

export const MetabaseTab = () => {
  const [iframeUrl, setIFrameUrl] = useState<AbsoluteUrl>("https://plip");
  const adminToken = useAdminToken();
  useEffect(() => {
    adminGateway
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .metabaseAgencyEmbed(adminToken)
      .subscribe((url: AbsoluteUrl) => setIFrameUrl(url));
  });

  return <MetabaseView title="Agences" url={iframeUrl} />;
};

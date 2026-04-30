import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { NotificationIndicator } from "react-design-system";
import type { UserEstablishmentRightDetailsWithPendingStatus } from "shared";
import { establishmentRoleToDisplay } from "src/app/components/establishment/establishment-users";

export const EstablishmentLineDesiredRoleInfos = ({
  data,
}: {
  data: UserEstablishmentRightDetailsWithPendingStatus;
}) => (
  <>
    <div className={fr.cx("fr-mb-1w")}>
      <Badge small {...establishmentRoleToDisplay[data.role]}>
        {establishmentRoleToDisplay[data.role].label}
      </Badge>
    </div>
    <div className={fr.cx("fr-mb-1w")}>
      <NotificationIndicator
        isNotified={data.shouldReceiveDiscussionNotifications}
      />
    </div>
  </>
);

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { NotificationIndicator } from "react-design-system";
import type { UserEstablishmentRightDetailsWithPendingStatus } from "shared";
import { establishmentRolesToDisplay } from "src/app/contents/userRolesToDisplay";

export const EstablishmentLineDesiredRoleInfos = ({
  data,
}: {
  data: UserEstablishmentRightDetailsWithPendingStatus;
}) => (
  <>
    <div className={fr.cx("fr-mb-1w")}>
      <Badge
        small
        className={fr.cx(establishmentRolesToDisplay[data.role].className)}
      >
        {establishmentRolesToDisplay[data.role].label}
      </Badge>
    </div>
    <div className={fr.cx("fr-mb-1w")}>
      <NotificationIndicator
        isNotified={data.shouldReceiveDiscussionNotifications}
      />
    </div>
  </>
);

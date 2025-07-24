import { Badge, type BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import {
  type DiscussionDisplayStatus,
  type DiscussionInList,
  type DiscussionReadDto,
  domElementIds,
  getDiscussionDisplayStatus,
} from "shared";

export const DiscussionStatusBadge = ({
  discussion,
  id = domElementIds.establishmentDashboard.discussion.statusBadge,
  small = false,
}: {
  discussion: DiscussionReadDto | DiscussionInList;
  id?: string;
  small?: BadgeProps["small"];
}) => {
  const statusBadge =
    statusBadgeData[
      getDiscussionDisplayStatus({
        discussion,
        now: new Date(),
      })
    ];
  return (
    <Badge id={id} severity={statusBadge.severity} small={small}>
      {statusBadge.label}
    </Badge>
  );
};

const statusBadgeData: Record<
  DiscussionDisplayStatus,
  {
    severity: BadgeProps["severity"];
    label: string;
  }
> = {
  new: {
    severity: "info",
    label: "En cours - Nouveau",
  },
  "needs-answer": {
    severity: "warning",
    label: "En cours - À répondre",
  },
  "needs-urgent-answer": {
    severity: "error",
    label: "En cours - Urgent",
  },
  answered: {
    severity: "new",
    label: "En cours - Répondu",
  },
  accepted: {
    severity: "success",
    label: "Acceptée",
  },
  rejected: {
    severity: undefined,
    label: "Refusée",
  },
};

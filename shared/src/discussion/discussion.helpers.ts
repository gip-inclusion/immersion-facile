import { subDays } from "date-fns";
import { match } from "ts-pattern";
import { emailReplySeparator } from "../email/email.content";
import type { ContactMode } from "../formEstablishment/FormEstablishment.dto";
import type { DateString } from "../utils/date";
import type {
  DiscussionDisplayStatusByRole,
  DiscussionInList,
  Exchange,
  ExchangeRole,
} from "./discussion.dto";

const isNowUrgent = ({ now, from }: { now: Date; from: DateString }) =>
  new Date(from) <= subDays(now, 15);

export const shouldBeReminded = ({
  lastExchange,
  discussionUpdatedAt,
  contactMode,
  isMainContactByPhone,
}: {
  lastExchange: Exchange;
  discussionUpdatedAt: DateString;
  contactMode: ContactMode;
  isMainContactByPhone: boolean;
}): boolean => {
  return (
    lastExchange &&
    lastExchange.sender === "potentialBeneficiary" &&
    new Date(discussionUpdatedAt) < subDays(Date.now(), 15) &&
    contactMode === "EMAIL" &&
    isMainContactByPhone
  );
};

export const getDiscussionDisplayStatus = <Role extends ExchangeRole>({
  discussion,
  shouldEstablishmentBeReminded,
  now,
  viewer,
}: {
  discussion: Pick<DiscussionInList, "status" | "exchangesData" | "createdAt">;
  shouldEstablishmentBeReminded: boolean;
  now: Date;
  viewer: Role;
}): DiscussionDisplayStatusByRole[Role] => {
  const status: DiscussionDisplayStatusByRole[Role] = match(discussion.status)
    .with("REJECTED", (): DiscussionDisplayStatusByRole[Role] => "rejected")
    .with("ACCEPTED", (): DiscussionDisplayStatusByRole[Role] => "accepted")
    .with("PENDING", (): DiscussionDisplayStatusByRole[Role] => {
      const { lastExchange, count } = discussion.exchangesData;

      if (shouldEstablishmentBeReminded && viewer === "potentialBeneficiary")
        return "to-remind";

      if (!lastExchange)
        return isNowUrgent({ now, from: discussion.createdAt })
          ? "needs-urgent-answer"
          : "new";

      if (count === 1 && !isNowUrgent({ now, from: lastExchange.sentAt }))
        return "new";

      if (lastExchange.sender === viewer) return "answered";

      if (isNowUrgent({ now, from: lastExchange.sentAt }))
        return "needs-urgent-answer";

      return "needs-answer";
    })
    .exhaustive();
  return status;
};

export const emailExchangeSplitters = [
  /<br>\s*(De(?:&nbsp;|\u00A0|\s)*:|Le(?:&nbsp;|\u00A0|\s).*?,)?\s*Immersion Facilitée\s*(?:<|&lt;)ne-pas-ecrire-a-cet-email@immersion-facile\.beta\.gouv\.fr(?:>|&gt;)[^<]*(?:&nbsp;|\u00A0|\s)*a\s*écrit(?:&nbsp;|\u00A0|\s)*:[^<]*<br>/i,
  emailReplySeparator,
];

import { subDays } from "date-fns";
import { match } from "ts-pattern";
import { emailReplySeparator } from "../email/email.content";
import type { DateString } from "../utils/date";
import type {
  DiscussionDisplayStatus,
  DiscussionInList,
} from "./discussion.dto";

const isNowUrgent = ({ now, from }: { now: Date; from: DateString }) =>
  new Date(from) <= subDays(now, 15);

export const getDiscussionDisplayStatus = ({
  discussion,
  now,
}: {
  discussion: Pick<DiscussionInList, "status" | "exchangesData" | "createdAt">;
  now: Date;
}): DiscussionDisplayStatus => {
  return match(discussion.status)
    .with("REJECTED", (): DiscussionDisplayStatus => "rejected")
    .with("ACCEPTED", (): DiscussionDisplayStatus => "accepted")
    .with("PENDING", (): DiscussionDisplayStatus => {
      const { lastExchange, count } = discussion.exchangesData;

      if (!lastExchange)
        return isNowUrgent({ now, from: discussion.createdAt })
          ? "needs-urgent-answer"
          : "new";

      if (lastExchange.sender === "establishment") return "answered";

      if (isNowUrgent({ now, from: lastExchange.sentAt }))
        return "needs-urgent-answer";

      if (count === 1) return "new";

      return "needs-answer";
    })
    .exhaustive();
};

export const emailExchangeSplitters = [
  /<br>\s*(De(?:&nbsp;|\u00A0|\s)*:|Le(?:&nbsp;|\u00A0|\s).*?,)?\s*Immersion Facilitée\s*(?:<|&lt;)ne-pas-ecrire-a-cet-email@immersion-facile\.beta\.gouv\.fr(?:>|&gt;)[^<]*(?:&nbsp;|\u00A0|\s)*a\s*écrit(?:&nbsp;|\u00A0|\s)*:[^<]*<br>/i,
  emailReplySeparator,
];

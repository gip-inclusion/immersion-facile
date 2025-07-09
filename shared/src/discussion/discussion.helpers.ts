import { subDays } from "date-fns";
import { sort } from "ramda";
import { match } from "ts-pattern";
import { emailReplySeparator } from "../email/email.content";
import type { DateString } from "../utils/date";
import type {
  DiscussionDisplayStatus,
  DiscussionReadDto,
  ExchangeRead,
} from "./discussion.dto";

const isNowUrgent = ({ now, from }: { now: Date; from: DateString }) =>
  new Date(from) <= subDays(now, 15);

export const getDiscussionDisplayStatus = ({
  discussion,
  now,
}: {
  discussion: Pick<DiscussionReadDto, "status" | "exchanges" | "createdAt">;
  now: Date;
}): DiscussionDisplayStatus => {
  return match(discussion.status)
    .with("REJECTED", (): DiscussionDisplayStatus => "rejected")
    .with("ACCEPTED", (): DiscussionDisplayStatus => "accepted")
    .with("PENDING", (): DiscussionDisplayStatus => {
      const orderedExchanges = sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        discussion.exchanges,
      );
      const latestExchange: ExchangeRead | undefined =
        orderedExchanges[orderedExchanges.length - 1];

      if (!latestExchange)
        return isNowUrgent({ now, from: discussion.createdAt })
          ? "needs-urgent-answer"
          : "new";

      if (latestExchange.sender === "establishment") return "answered";

      if (isNowUrgent({ now, from: latestExchange.sentAt }))
        return "needs-urgent-answer";

      if (orderedExchanges.length === 1) return "new";

      return "needs-answer";
    })
    .exhaustive();
};

export const emailExchangeSplitters = [
  /<br>\s*(De(?:&nbsp;|\u00A0|\s)*:|Le(?:&nbsp;|\u00A0|\s).*?,)?\s*Immersion Facilitée\s*(?:<|&lt;)ne-pas-ecrire-a-cet-email@immersion-facile\.beta\.gouv\.fr(?:>|&gt;)[^<]*(?:&nbsp;|\u00A0|\s)*a\s*écrit(?:&nbsp;|\u00A0|\s)*:[^<]*<br>/i,
  emailReplySeparator,
];

import { subDays } from "date-fns";
import { sort } from "ramda";
import { match } from "ts-pattern";
import type { DateString } from "../utils/date";
import type {
  DiscussionDisplayStatus,
  DiscussionReadDto,
  Exchange,
} from "./discussion.dto";

const isNowUrgent = ({ now, from }: { now: Date; from: DateString }) =>
  new Date(from) <= subDays(now, 15);

export const getDiscussionDisplayStatus = ({
  discussion,
  now,
}: {
  discussion: DiscussionReadDto;
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
      const latestExchange: Exchange | undefined =
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

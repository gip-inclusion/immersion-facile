--------------------------------------------------------------
-- count the number of discussions before having one establishment that replies
-- this query is used to update the static information on the search page /recherche
--------------------------------------------------------------

WITH beneficiaries_having_replies as (
    SELECT d.id AS discussion_id, d.potential_beneficiary_email, d.created_at, COUNT(e.id) AS message_count
    FROM discussions d
    LEFT JOIN exchanges e ON d.id = e.discussion_id
    GROUP BY d.id, d.potential_beneficiary_email, d.created_at
    HAVING count(e.id) > 1
), beneficiaries_with_only_one_discussion_with_reply as (
    SELECT potential_beneficiary_email, COUNT(beneficiaries_having_replies.discussion_id)
    FROM beneficiaries_having_replies
    GROUP BY potential_beneficiary_email
    HAVING COUNT(beneficiaries_having_replies.discussion_id) = 1
), discussions_count_before_reply_by_beneficiary as (
    SELECT discussions.potential_beneficiary_email, COUNT(discussions.id) as discussion_count
    FROM discussions
    WHERE potential_beneficiary_email in (
        SELECT beneficiaries_with_only_one_discussion_with_reply.potential_beneficiary_email
        FROM beneficiaries_with_only_one_discussion_with_reply
    )
    GROUP BY discussions.potential_beneficiary_email
)
SELECT AVG(discussions_count_before_reply_by_beneficiary.discussion_count)
FROM discussions_count_before_reply_by_beneficiary;

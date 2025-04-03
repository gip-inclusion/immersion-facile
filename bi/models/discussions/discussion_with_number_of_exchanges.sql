{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select 
    discussions.*,
    count(exchanges.id) as number_of_exchanges
from discussions
left join exchanges 
    on discussions.id = exchanges.discussion_id
group by discussions.id, discussions.siret

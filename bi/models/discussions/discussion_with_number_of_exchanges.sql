{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

with exchange_counts as (
  select
    discussion_id,
    count(*) as number_of_exchanges
  from {{ source('immersion', 'exchanges') }}
  group by discussion_id
)

select
  d.*,
  coalesce(ec.number_of_exchanges, 0) as number_of_exchanges
from {{ source('immersion', 'discussions') }} d
left join exchange_counts ec
  on d.id = ec.discussion_id

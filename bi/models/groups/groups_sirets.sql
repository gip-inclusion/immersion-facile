{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    group_slug,
    siret::text as siret
from {{ source('immersion', 'groups__sirets') }}

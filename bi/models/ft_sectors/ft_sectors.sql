{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    code,
    label
from {{ source('immersion', 'ft_sectors') }}

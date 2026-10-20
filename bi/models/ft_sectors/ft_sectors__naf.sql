{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    ft_sector_code,
    naf_code::text as naf_code
from {{ source('immersion', 'ft_sectors__naf') }}

{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    ft_sector_code,
    rome_code::text as rome_code
from {{ source('immersion', 'ft_sectors__rome') }}

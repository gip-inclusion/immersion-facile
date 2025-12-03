{{
    config(
        materialized='table',
        schema='public_analytics'
    )
}}

select
    day,
    appellation_code,
    address,
    department_code,
    count
from {{ source('immersion', 'most_frequent_searches') }}

{{
    config(
        materialized='table',
        schema='analytics'
    )
}}

select
    day,
    appellation_code,
    address,
    department_code,
    count
from {{ source('immersion', 'stats__most_frequent_searches') }}

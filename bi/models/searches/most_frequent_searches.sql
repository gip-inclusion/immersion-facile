{{
    config(
        materialized='table',
        schema='analytics'
    )
}}

select
    mfs.day,
    mfs.address,
    mfs.department_code,
    mfs.count,
    mfs.avg_number_of_results,
    mfs.appellation_code,
    appellations.libelle_appellation_long as appellation_label
from {{ source('immersion', 'stats__most_frequent_searches') }} as mfs
left join {{ source('immersion', 'public_appellations_data') }} as appellations
    on mfs.appellation_code = appellations.ogr_appellation

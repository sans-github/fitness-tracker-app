# ER Diagram

Authoritative snapshot of the live schema. Updated with every migration.

```mermaid
erDiagram
    WORKOUT_LOG {
        uuid id PK "not null"
        varchar_50 exercise "not null"
        decimal_6_2 weight_lbs "not null"
        int sets "not null"
        int reps "not null"
        timestamp created_at "not null"
        timestamp updated_at "not null"
        timestamp deleted_at "nullable"
    }
```

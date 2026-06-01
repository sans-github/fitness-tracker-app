CREATE TABLE workout_log (
    id          UUID          NOT NULL,
    exercise    VARCHAR(50)   NOT NULL,
    weight_lbs  DECIMAL(6, 2) NOT NULL,
    sets        INT           NOT NULL,
    reps        INT           NOT NULL,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP     NOT NULL,
    deleted_at  TIMESTAMP     NULL,
    CONSTRAINT pk_workout_log PRIMARY KEY (id)
);

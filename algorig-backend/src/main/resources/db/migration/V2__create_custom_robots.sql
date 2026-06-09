CREATE TABLE IF NOT EXISTS custom_robots (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(100)  NOT NULL,
    tier             VARCHAR(10)   NOT NULL,
    hp               INT           NOT NULL,
    core_impact      INT           NOT NULL,
    exploit_power    INT           NOT NULL,
    clock_speed      INT           NOT NULL,
    chassis_armor    INT           NOT NULL,
    firewall_strength INT          NOT NULL,
    battery          INT           NOT NULL,
    passive_ability  VARCHAR(255)  NOT NULL,
    parts_config     TEXT          DEFAULT NULL,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_custom_robots_user_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_custom_robots_user_id ON custom_robots (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_robots_tier    ON custom_robots (tier);

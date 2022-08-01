CREATE TABLE wallet (
    id serial PRIMARY KEY,
    address VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

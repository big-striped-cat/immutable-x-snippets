CREATE TABLE price (
    id serial PRIMARY KEY,
    date date NOT NULL UNIQUE,
    values jsonb NOT NULL default '{}'
);
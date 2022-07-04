CREATE TABLE asset (
    id serial PRIMARY KEY,
    date date NOT NULL,
    wallet VARCHAR NOT NULL,
    values jsonb NOT NULL default '{}'
);

CREATE UNIQUE INDEX date_wallet_uniq_idx ON asset (date, wallet);
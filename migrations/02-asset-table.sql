CREATE TABLE asset (
    id serial PRIMARY KEY,
    date date NOT NULL,
    wallet VARCHAR NOT NULL,
    proto INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    CONSTRAINT date_wallet_proto_uniq UNIQUE (date, wallet, proto)
);

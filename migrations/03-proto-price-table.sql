CREATE TABLE proto_price (
    id serial PRIMARY KEY,
    date date NOT NULL,
    proto bigint NOT NULL,
    price bigint NOT NULL,  -- gwei

    CONSTRAINT date_proto_uniq UNIQUE (date, proto)
);

ALTER TABLE asset
ADD COLUMN wallet_id integer;

UPDATE asset
SET wallet_id = (SELECT MIN(id) FROM wallet);

ALTER TABLE asset
DROP COLUMN wallet;

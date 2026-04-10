-- Prisma belum bisa mengekspresikan partial unique index untuk
-- "1 record aktif per employee per tanggal", jadi constraint ini
-- perlu ditambahkan manual di migration SQL.

CREATE UNIQUE INDEX IF NOT EXISTS uq_performance_records_employee_tanggal_active
ON performance_records (employee_id, tanggal)
WHERE deleted_at IS NULL;

ALTER TABLE products
  ADD CONSTRAINT products_upah_satuan_positive
  CHECK (upah_satuan > 0);

ALTER TABLE performance_records
  ADD CONSTRAINT performance_records_total_upah_non_negative
  CHECK (total_upah >= 0);

ALTER TABLE performance_record_items
  ADD CONSTRAINT performance_record_items_qty_positive
  CHECK (qty > 0);

ALTER TABLE performance_record_items
  ADD CONSTRAINT performance_record_items_upah_non_negative
  CHECK (upah >= 0);

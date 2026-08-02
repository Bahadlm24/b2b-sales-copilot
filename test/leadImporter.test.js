import test from "node:test";
import assert from "node:assert/strict";
import { phoneKey, prepareLeadImport } from "../src/services/leadImporter.js";

test("yalnızca telefonu zorunlu tutar", () => {
  const [row] = prepareLeadImport([{ telefon: "0530 505 66 48" }]);

  assert.equal(row.status, "ready");
  assert.equal(row.firstName, "");
  assert.equal(row.email, "");
  assert.equal(row.phone, "+90 530 505 66 48");
});

test("mevcut lead telefonunu mükerrer olarak işaretler", () => {
  const [row] = prepareLeadImport(
    [{ Ad: "Ayşe", Soyad: "Yılmaz", Telefon: "0530 505 66 48", Mail: "ayse@example.com" }],
    [{ phone: "+90 530 505 66 48" }],
  );

  assert.equal(row.status, "duplicate");
  assert.equal(row.message, "Bu kişinin telefon numarası kayıtlı");
});

test("aynı Excel içindeki ikinci telefonu mükerrer sayar", () => {
  const rows = prepareLeadImport([
    { ad: "Birinci", telefon: "0530 505 66 48" },
    { ad: "İkinci", telefon: "+90 530 505 66 48" },
    { ad: "Üçüncü", telefon: "0532 111 22 33" },
  ]);

  assert.deepEqual(rows.map((row) => row.status), ["ready", "duplicate", "ready"]);
});

test("hatalı satır diğer geçerli satırları engellemez", () => {
  const rows = prepareLeadImport([
    { ad: "Telefonsuz", telefon: "" },
    { ad: "Geçerli", telefon: "0532 111 22 33" },
  ]);

  assert.equal(rows[0].status, "error");
  assert.equal(rows[1].status, "ready");
});

test("telefon karşılaştırma anahtarını biçimden bağımsız üretir", () => {
  assert.equal(phoneKey("0530 505 66 48"), phoneKey("+90 (530) 505-66-48"));
});

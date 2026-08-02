import test from "node:test";
import assert from "node:assert/strict";
import { formatPhoneNumber } from "../src/services/phoneFormatter.js";

test("Türkiye cep telefonu biçimlerini standartlaştırır", () => {
  for (const input of ["05305056648", "530 505 66 48", "+90 (530) 505-66-48", "0090 530 505 6648", "90 530 505 66 48"]) {
    assert.equal(formatPhoneNumber(input), "+90 530 505 66 48");
  }
});

test("Türkiye sabit hatlarını aynı biçimde standartlaştırır", () => {
  assert.equal(formatPhoneNumber("0212 555 10 90"), "+90 212 555 10 90");
});

test("yabancı ülke kodlu numaraları değiştirmez", () => {
  assert.equal(formatPhoneNumber("+49 151 23456789"), "+49 151 23456789");
  assert.equal(formatPhoneNumber("0044 20 7946 0958"), "0044 20 7946 0958");
});

test("boş değerleri güvenli biçimde işler", () => {
  assert.equal(formatPhoneNumber(null), "");
});

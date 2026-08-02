import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, roleLabel } from "../src/services/authorization.js";

test("yönetici tüm modüllere erişebilir", () => {
  for (const permission of ["dashboard", "leads", "meeting", "meetings", "tasks", "customers", "offers", "analytics", "users", "settings"]) {
    assert.equal(hasPermission("admin", permission), true);
  }
});

test("temsilci kullanıcı ve analiz yönetimine erişemez", () => {
  assert.equal(hasPermission("representative", "users"), false);
  assert.equal(hasPermission("representative", "analytics"), false);
  assert.equal(hasPermission("representative", "meeting"), true);
  assert.equal(hasPermission("representative", "leads"), true);
});

test("bilinmeyen roller güvenli biçimde reddedilir", () => {
  assert.equal(hasPermission("unknown", "dashboard"), false);
  assert.equal(roleLabel("unknown"), "Tanımsız rol");
});

import test from "node:test";
import assert from "node:assert/strict";
import { getAppConfig, resolveApiBaseUrl } from "../src/config/appConfig.js";

test("varsayılan API kökü yerel mock adrestir", () => {
  assert.equal(resolveApiBaseUrl(), "http://localhost:3000/api");
});

test("yapılandırma yerel kip ve localStorage kalıcılığıyla açılır", () => {
  const config = getAppConfig();
  assert.equal(config.mode, "local");
  assert.equal(config.persistMode, "local");
});

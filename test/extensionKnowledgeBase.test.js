import test from "node:test";
import assert from "node:assert/strict";
import { findKnowledge, parseKnowledgeArticle } from "../extension/knowledge-base.js";

const markdown = `---
id: integrations
intents: integration,api
title: Entegrasyon Rehberi
version: 1.2
---

## tr
Standart entegrasyon doğrulaması kapsam analizinden sonra yapılır.

### followUp
Hangi API kullanılacak?

## en
Integration validation follows scope analysis.

### followUp
Which API will be used?
`;

test("Markdown bilgi kaynağını iki dilde ayrıştırır", () => {
  const article = parseKnowledgeArticle(markdown, "integrations.md");
  assert.equal(article.id, "integrations");
  assert.equal(article.version, "1.2");
  assert.match(article.tr.answer, /kapsam analizinden/);
  assert.match(article.en.followUp, /Which API/);
});

test("soru niyetine uygun kaynaklı cevabı bulur", () => {
  const article = parseKnowledgeArticle(markdown, "integrations.md");
  const result = findKnowledge([article], "API entegrasyonu nasıl çalışır?", "integration", "tr");
  assert.equal(result.source, "knowledge/integrations.md");
  assert.equal(result.confidence, "high");
  assert.match(result.followUpQuestion, /Hangi API/);
});

const KNOWLEDGE_FILES = ["integrations.md", "pricing.md", "security.md", "support.md"];

function frontmatterValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*(.+)$`, "mi"))?.[1]?.trim() || "";
}

function languageSection(source, language) {
  const match = source.match(new RegExp(`## ${language}\\s*([\\s\\S]*?)(?=\\n## |$)`, "i"));
  if (!match) return { answer: "", followUp: "" };
  const [answerPart, followUp = ""] = match[1].split(/\n### followUp\s*/i);
  return { answer: answerPart.trim(), followUp: followUp.trim() };
}

export function parseKnowledgeArticle(source, fileName = "knowledge.md") {
  return {
    id: frontmatterValue(source, "id") || fileName.replace(/\.md$/i, ""),
    title: frontmatterValue(source, "title") || fileName,
    version: frontmatterValue(source, "version") || "1.0",
    intents: frontmatterValue(source, "intents").split(",").map((item) => item.trim()).filter(Boolean),
    source: `knowledge/${fileName}`,
    tr: languageSection(source, "tr"),
    en: languageSection(source, "en")
  };
}

export async function loadKnowledgeBase() {
  const articles = [];
  for (const fileName of KNOWLEDGE_FILES) {
    const response = await fetch(chrome.runtime.getURL(`knowledge/${fileName}`));
    if (response.ok) articles.push(parseKnowledgeArticle(await response.text(), fileName));
  }
  return articles;
}

export function findKnowledge(articles, query, intent, language = "tr") {
  const normalized = String(query || "").toLocaleLowerCase("tr-TR");
  const ranked = articles.map((article) => {
    let score = article.intents.includes(intent) ? 5 : 0;
    for (const keyword of article.intents) if (normalized.includes(keyword)) score += 2;
    return { article, score };
  }).sort((a, b) => b.score - a.score);
  const match = ranked[0];
  if (!match || match.score === 0) return null;
  const content = match.article[language]?.answer ? match.article[language] : match.article.tr;
  return {
    id: match.article.id,
    answer: content.answer,
    followUpQuestion: content.followUp,
    source: match.article.source,
    sourceTitle: match.article.title,
    version: match.article.version,
    confidence: match.score >= 5 ? "high" : "medium"
  };
}

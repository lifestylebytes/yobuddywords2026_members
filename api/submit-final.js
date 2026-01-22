const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function safeText(value, max = 2000) {
  const text = typeof value === "string" ? value : String(value || "");
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const NOTION_SECRET = process.env.NOTION_SECRET;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_SECRET || !DATABASE_ID) {
    res.statusCode = 500;
    res.end("Missing Notion configuration.");
    return;
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      res.statusCode = 400;
      res.end("Invalid JSON.");
      return;
    }
  }

  const name = safeText(payload?.name || "");
  const score = Number(payload?.score ?? 0);
  const total = Number(payload?.total ?? 0);
  const submittedAt = payload?.submittedAt || new Date().toISOString();
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  const writeAnswers = Array.isArray(payload?.answers?.write)
    ? payload.answers.write.map((item) => safeText(item?.answer || ""))
    : [];

  if (!name) {
    res.statusCode = 400;
    res.end("Name is required.");
    return;
  }

  const properties = {
    이름: {
      title: [{ text: { content: name } }]
    },
    점수: { number: score },
    총점: { number: total },
    정답률: { number: percent },
    제출시간: { date: { start: submittedAt } },
    "주관식 답변1": {
      rich_text: [{ text: { content: writeAnswers[0] || "" } }]
    },
    "주관식 답변2": {
      rich_text: [{ text: { content: writeAnswers[1] || "" } }]
    },
    "주관식 답변3": {
      rich_text: [{ text: { content: writeAnswers[2] || "" } }]
    },
    "주관식 답변4": {
      rich_text: [{ text: { content: writeAnswers[3] || "" } }]
    },
    "주관식 답변5": {
      rich_text: [{ text: { content: writeAnswers[4] || "" } }]
    }
  };

  const schemaRes = await fetch(`${NOTION_API_BASE}/databases/${DATABASE_ID}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${NOTION_SECRET}`,
      "Notion-Version": NOTION_VERSION
    }
  });

  if (!schemaRes.ok) {
    const text = await schemaRes.text();
    res.statusCode = 502;
    res.end(text);
    return;
  }

  const schema = await schemaRes.json();
  const allowedProps = new Set(Object.keys(schema.properties || {}));
  const filteredProperties = Object.fromEntries(
    Object.entries(properties).filter(([key]) => allowedProps.has(key))
  );

  const notionRes = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_SECRET}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parent: { database_id: DATABASE_ID },
      properties: filteredProperties
    })
  });

  if (!notionRes.ok) {
    const text = await notionRes.text();
    res.statusCode = 502;
    res.end(text);
    return;
  }

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
};

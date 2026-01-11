// sync-notion.js
// 노션 단어장 DB → questions.js 자동 생성 스크립트 (유버디 버전)

require("dotenv").config();
const fs = require("fs/promises");

const fetchFn =
  typeof fetch === "function"
    ? fetch
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const RAW_DB_ID = process.env.NOTION_DATABASE_ID;
const NOTION_SECRET = process.env.NOTION_SECRET;

// 하이픈 섞여 있어도 상관 없지만, 깔끔하게 정규화
const DATABASE_ID = RAW_DB_ID ? RAW_DB_ID.replace(/[^a-f0-9]/gi, "") : null;

if (!NOTION_SECRET || !DATABASE_ID) {
  console.error("❌ NOTION_SECRET 또는 NOTION_DATABASE_ID가 없습니다. .env를 확인해주세요.");
  process.exit(1);
}

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// ──────────────────────────────────────────────
//  헬퍼: 프로퍼티 이름 느슨 매칭
// ──────────────────────────────────────────────
function findProp(props, targetName) {
  if (!props) return undefined;
  if (props[targetName]) return props[targetName];

  const normalizedTarget = targetName.replace(/\s+/g, "").toLowerCase();
  const key = Object.keys(props).find(
    (k) => k.replace(/\s+/g, "").toLowerCase() === normalizedTarget
  );
  return key ? props[key] : undefined;
}

// ──────────────────────────────────────────────
//  헬퍼: title / rich_text → plain text
// ──────────────────────────────────────────────
function extractText(prop) {
  if (!prop || !prop.type) return "";

  if (prop.type === "title") {
    return (prop.title || [])
      .map((t) => t.plain_text || "")
      .join("")
      .trim();
  }

  if (prop.type === "rich_text") {
    return (prop.rich_text || [])
      .map((t) => t.plain_text || "")
      .join("")
      .trim();
  }

  if (prop.type === "formula" && prop.formula && prop.formula.type === "string") {
    return (prop.formula.string || "").trim();
  }

  return "";
}

// ──────────────────────────────────────────────
//  노션 DB 전체 페이지 가져오기
// ──────────────────────────────────────────────
async function fetchAllPagesFromDatabase() {
  let hasMore = true;
  let startCursor = undefined;
  const allResults = [];

  while (hasMore) {
    const body = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const res = await fetchFn(
      `${NOTION_API_BASE}/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_SECRET}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Notion API 오류: ${res.status} ${res.statusText}\n${errorText}`
      );
    }

    const data = await res.json();
    if (data.object === "error") {
      throw new Error(`Notion API 에러: ${data.message}`);
    }

    allResults.push(...(data.results || []));
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  return allResults;
}

// ──────────────────────────────────────────────
//  예문 → prefix / suffix 만들기
//  1) 예문 안에 '_'가 있으면, 그 구간을 "빈칸"으로 보고 앞/뒤 자르기
//  2) '_'가 전혀 없으면, answer 문자열 위치로 자르기 (fallback)
// ──────────────────────────────────────────────
function buildQuestionFromRow(vocab, sentence, meaning, translation, addedDate) {
  if (!vocab || !sentence) return null;

  const s = sentence.replace(/\u00a0/g, " ");

  const firstUnderscore = s.indexOf("_");
  if (firstUnderscore !== -1) {
    let lastUnderscore = s.lastIndexOf("_");
    while (lastUnderscore + 1 < s.length && s[lastUnderscore + 1] === "_") {
      lastUnderscore++;
    }

    return {
      answer: vocab,
      prefix: s.slice(0, firstUnderscore).trimEnd(),
      suffix: s.slice(lastUnderscore + 1).trimStart(),
      meaning,
      translation: translation || "",
      addedDate
    };
  }

  const idx = s.toLowerCase().indexOf(vocab.toLowerCase());

  if (idx === -1) {
    return {
      answer: vocab,
      prefix: s.trim(),
      suffix: "",
      meaning,
      translation: translation || "",
      addedDate
    };
  }

  return {
    answer: vocab,
    prefix: s.slice(0, idx).trimEnd(),
    suffix: s.slice(idx + vocab.length).trimStart(),
    meaning,
    translation: translation || "",
    addedDate
  };
}

// ──────────────────────────────────────────────
//  JS 소스 코드용 문자열 리터럴로 변환
// ──────────────────────────────────────────────
function toJSStringLiteral(str) {
  const safe = (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  return `"${safe}"`;
}

function buildObjectLiteral(q) {
  return [
    "  {",
    `    answer: ${toJSStringLiteral(q.answer)},`,
    `    prefix: ${toJSStringLiteral(q.prefix)},`,
    `    suffix: ${toJSStringLiteral(q.suffix)},`,
    `    meaning: ${toJSStringLiteral(q.meaning)},`,
    `    translation: ${toJSStringLiteral(q.translation)},`,
    `    addedDate: ${toJSStringLiteral(q.addedDate)}`,
    "  }",
  ].join("\n");
}

// ──────────────────────────────────────────────
//  메인: questions.js 생성
// ──────────────────────────────────────────────
async function buildQuestionsFile() {
  console.log("📥 노션 데이터베이스에서 단어를 불러오는 중...");

  const pages = await fetchAllPagesFromDatabase();
  console.log(`✅ ${pages.length}개의 페이지를 가져왔습니다.`);

  const questions = [];
  let skippedNoWordTag = 0;
  let skippedMissing = 0;

  for (const page of pages) {
  const props = page.properties || {};

  // 1️⃣ word 필터
  const selectProp = findProp(props, "선택");
  const isWord =
    selectProp &&
    selectProp.type === "select" &&
    selectProp.select &&
    selectProp.select.name === "word";

  if (!isWord) {
    skippedNoWordTag++;
    continue;
  }

  // 2️⃣ 컬럼 매핑
  const vocabProp = findProp(props, "어휘");
  const sentenceProp = findProp(props, "예문");
  const meaningProp = findProp(props, "뜻 (클릭하면 설명)");
  const translationProp =
    findProp(props, "예문 해석 AI") || findProp(props, "예문 해석");

  const vocab = extractText(vocabProp);
  const sentence = extractText(sentenceProp);
  const meaning = extractText(meaningProp);
  const translation = extractText(translationProp);

  if (!vocab || !sentence) {
    skippedMissing++;
    continue;
  }

  // 3️⃣ 추가일 (created_time)
  const addedDateProp = findProp(props, "추가일");

  console.log(
    "[DEBUG 추가일]",
    vocab,
    addedDateProp?.type,
    addedDateProp
  );
  
  const addedDate =
    addedDateProp?.type === "date"
      ? addedDateProp.date?.start
      : null;

  // 4️⃣ 질문 생성
  const q = buildQuestionFromRow(
    vocab,
    sentence,
    meaning,
    translation,
    addedDate
  );

  if (!q) {
    skippedMissing++;
    continue;
  }

  questions.push(q);
}

  const wordCount = pages.length - skippedNoWordTag;
  console.log(
    `🧮 필터 결과: 'word' 태그 ${wordCount}개 중, questions ${questions.length}개 생성.`
  );
  if (skippedMissing > 0) {
    console.log(
      `ℹ️ 어휘 또는 예문이 비어 있어서 스킵된 항목: ${skippedMissing}개`
    );
  }

  const objectLiterals = questions.map(buildObjectLiteral).join(",\n");

  

  const fileContent =
    "// questions.js\n\n" +
    "const QUESTIONS = [\n" +
    objectLiterals +
    "\n];\n";

  await fs.writeFile("questions.js", fileContent, "utf8");

  console.log(
    `💾 questions.js 생성 완료! 총 ${questions.length}개 문장이 저장되었습니다.`
  );
}

// 실행
buildQuestionsFile().catch((err) => {
  console.error("❌ 동기화 중 에러 발생:", err);
  process.exit(1);
});

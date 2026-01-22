// final.js

function getTodayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

const RELEASE_DATE = "2026-02-01";
const DEV_CODE = "222";
const today = getTodayKST();
const params = new URLSearchParams(window.location.search);
const isPreview = params.get("preview") === "1";
const isAutofill = params.get("autofill") === "1";

const ALLOWED_NAMES = Array.isArray(window.FINAL_ALLOWED_NAMES)
  ? window.FINAL_ALLOWED_NAMES
  : [];
const FINAL_CONFIG = window.FINAL_CONFIG || {};
const SUBMIT_ENDPOINT = FINAL_CONFIG.submitEndpoint || "";

const examDateEl = document.getElementById("examDate");
const gateMessage = document.getElementById("gateMessage");
const examForm = document.getElementById("examForm");
const nameGate = document.getElementById("nameGate");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("participantName");
const nameError = document.getElementById("nameError");
const devCodeForm = document.getElementById("devCodeForm");
const devCodeInput = document.getElementById("devCodeInput");
const devCodeError = document.getElementById("devCodeError");
const resultModal = document.getElementById("resultModal");
const scoreNameLine = document.getElementById("scoreNameLine");
const scoreSummary = document.getElementById("scoreSummary");
const scorePercent = document.getElementById("scorePercent");
const writeReview = document.getElementById("writeReview");
const fullReview = document.getElementById("fullReview");
const reviewTitle = document.getElementById("reviewTitle");
const reviewList = document.getElementById("reviewList");
const copyReviewBtn = document.getElementById("copyReviewBtn");
const emailReviewBtn = document.getElementById("emailReviewBtn");
const completionModal = document.getElementById("completionModal");

const USED_NAME_KEY = "finalUsedNames";
const SUBMIT_KEY = "finalSubmissions";
const DRAFT_KEY = "finalDrafts";
let participantName = "";

if (examDateEl) {
  examDateEl.textContent = `Open: ${RELEASE_DATE}`;
}

function showGate() {
  if (gateMessage) gateMessage.classList.remove("hidden");
  if (examForm) examForm.classList.add("hidden");
  if (nameGate) nameGate.classList.add("hidden");
}

function showNameGate() {
  if (gateMessage) gateMessage.classList.add("hidden");
  if (examForm) examForm.classList.add("hidden");
  if (nameGate) nameGate.classList.remove("hidden");
}

if (!isPreview && today < RELEASE_DATE) {
  showGate();
} else {
  showNameGate();
}

if (isPreview) {
  addUsedName("유버디");
}

function createChoice(name, value, labelText) {
  const label = document.createElement("label");
  label.className = "choice";

  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  input.value = value;

  const span = document.createElement("span");
  span.textContent = labelText;

  label.appendChild(input);
  label.appendChild(span);
  return label;
}

function normalizeAnswerKey(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMeaningMap() {
  const source = Array.isArray(window.QUESTIONS) ? window.QUESTIONS : [];
  const map = new Map();
  source.forEach((item) => {
    const meaning = (item.meaning || "").replace(/^\s*\d+\.\s*/, "").trim();
    if (item.answer && meaning) {
      map.set(item.answer, meaning);
      map.set(normalizeAnswerKey(item.answer), meaning);
    }
  });
  return map;
}

function getMeaningForAnswer(map, answer) {
  if (!map || !answer) return "";
  return map.get(answer) || map.get(normalizeAnswerKey(answer)) || "";
}

function renderExam() {
  const data = window.FINAL_QUESTIONS;
  if (!data) return;

  const oxList = document.getElementById("oxList");
  const multiList = document.getElementById("multiList");
  const fillList = document.getElementById("fillList");
  const writeList = document.getElementById("writeList");
  let globalNumber = 1;

  data.ox.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "question";
    li.innerHTML = `
      <div class="question-title"><span class="question-number">${globalNumber}</span>${item.sentence}</div>
      <div class="question-sub">뜻: ${item.meaning}</div>
    `;
    const row = document.createElement("div");
    row.className = "ox-row";
    row.appendChild(createChoice(`ox-${index}`, "O", "O"));
    row.appendChild(createChoice(`ox-${index}`, "X", "X"));
    li.appendChild(row);
    oxList.appendChild(li);
    globalNumber++;
  });

  data.multi.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "question";
    li.innerHTML = `
      <div class="question-title"><span class="question-number">${globalNumber}</span>${item.sentence}</div>
      <div class="question-sub">${item.translation}</div>
    `;
    const row = document.createElement("div");
    row.className = "choice-row";
    item.options.forEach(option => {
      row.appendChild(createChoice(`multi-${index}`, option, option));
    });
    li.appendChild(row);
    multiList.appendChild(li);
    globalNumber++;
  });

  data.fill.forEach((item, index) => {
    const masked = maskAnswer(item.answer);
    const li = document.createElement("li");
    li.className = "question";
    li.innerHTML = `
      <div class="question-title"><span class="question-number">${globalNumber}</span>${item.sentence.replace("____", masked)}</div>
      <div class="question-sub">${item.translation}</div>
    `;
    const input = document.createElement("input");
    input.className = "fill-input";
    input.type = "text";
    input.name = `fill-${index}`;
    input.autocomplete = "off";
    li.appendChild(input);
    fillList.appendChild(li);
    globalNumber++;
  });

  data.write.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "question";
    li.innerHTML = `
      <div class="question-title"><span class="question-number">${globalNumber}</span>${item.prompt}</div>
    `;
    const input = document.createElement("textarea");
    input.className = "write-input";
    input.name = `write-${index}`;
    li.appendChild(input);
    writeList.appendChild(li);
    globalNumber++;
  });

  if (isPreview && isAutofill) {
    autofillExam(data, 0.7);
  }
}

function normalise(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z\s;:'-]/g, "")
    .trim();
}

function normaliseFill(str) {
  return normalise(str).replace(/[\s-]/g, "");
}

function maskAnswer(answer) {
  const words = (answer || "").trim().split(/\s+/).filter(Boolean);
  return words
    .map((word) => {
      const parts = word.split("-");
      return parts.map(() => "_____").join("-");
    })
    .join(" ");
}

function normalizeToken(token) {
  return token.toLowerCase().replace(/[^a-z']/g, "");
}

function escapeHTML(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightUserDiff(userText, modelText) {
  const userTokens = (userText || "").split(/\s+/).filter(Boolean);
  const modelTokens = (modelText || "").split(/\s+/).filter(Boolean);
  if (userTokens.length === 0) return "(미작성)";

  const spans = [];
  for (let i = 0; i < userTokens.length; i++) {
    const userToken = userTokens[i];
    const modelToken = modelTokens[i] || "";
    const isMatch =
      normalizeToken(userToken) &&
      normalizeToken(userToken) === normalizeToken(modelToken);
    const cls = isMatch ? "match" : "diff";
    spans.push(`<span class="${cls}">${escapeHTML(userToken)}</span>`);
  }
  return spans.join(" ");
}

function calcSimilarityPercent(userText, modelText) {
  const userTokens = (userText || "").split(/\s+/).filter(Boolean);
  const modelTokens = (modelText || "").split(/\s+/).filter(Boolean);
  if (modelTokens.length === 0) return 0;
  let match = 0;
  for (let i = 0; i < modelTokens.length; i++) {
    const modelToken = normalizeToken(modelTokens[i]);
    const userToken = normalizeToken(userTokens[i] || "");
    if (modelToken && modelToken === userToken) {
      match++;
    }
  }
  return Math.round((match / modelTokens.length) * 100);
}

function scoreExam() {
  const data = window.FINAL_QUESTIONS;
  if (!data) return;

  let correct = 0;
  let total = 0;

  data.ox.forEach((item, index) => {
    total++;
    const selected = document.querySelector(`input[name="ox-${index}"]:checked`);
    if (selected && selected.value === item.answer) correct++;
  });

  data.multi.forEach((item, index) => {
    total++;
    const selected = document.querySelector(`input[name="multi-${index}"]:checked`);
    if (selected && selected.value === item.answer) correct++;
  });

  data.fill.forEach((item, index) => {
    total++;
    const input = document.querySelector(`input[name="fill-${index}"]`);
    if (input && normaliseFill(input.value) === normaliseFill(item.answer)) {
      correct++;
    }
  });

  if (scoreSummary) {
    scoreSummary.textContent = `${total}문항 중 ${correct}문항 정답`;
  }
  if (scorePercent) {
    const percent = Math.round((correct / total) * 100);
    scorePercent.textContent = `${percent}%`;
    if (scoreNameLine) {
      scoreNameLine.innerHTML = `<span class="name">${participantName || "참여자"}</span> 님 정답률`;
    }
  }

  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
  if (resultModal) {
    resultModal.classList.remove("hidden");
    resultModal.style.display = "flex";
  }
  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
  if (examForm) {
    Array.from(examForm.elements).forEach((el) => {
      el.disabled = true;
    });
  }
  if (writeReview) {
    writeReview.innerHTML = "";
    data.write.forEach((item, index) => {
      const input = document.querySelector(`textarea[name="write-${index}"]`);
      const text = input ? input.value.trim() : "";
      const wrap = document.createElement("div");
      wrap.className = "write-item";
      const model = item.model || `I will ${item.target} in this situation.`;
      const similarity = calcSimilarityPercent(text, model);
      const writeNumber = 26 + index;
      const labelClass = similarity >= 70 ? "label good" : "label";
      wrap.innerHTML = `
        <div class="${labelClass}">${writeNumber}. 유사도 ${similarity}%</div>
        <div class="label">제출 답안</div>
        <div class="value">${highlightUserDiff(text, model)}</div>
        <div class="label">모범 답안</div>
        <div class="model">${escapeHTML(model)}</div>
      `;
      writeReview.appendChild(wrap);
    });
  }

  renderReviewList(data);
  renderFullReview(data, collectAnswers());

  saveSubmission({
    name: participantName,
    score: correct,
    total,
    submittedAt: new Date().toISOString(),
    answers: collectAnswers()
  });
  removeDraftByName(participantName);
}

function renderReviewList(data) {
  if (!reviewList) return;
  const wrongAnswers = [];

  data.ox.forEach((item, index) => {
    const selected = document.querySelector(`input[name="ox-${index}"]:checked`);
    if (!selected || selected.value !== item.answer) {
      wrongAnswers.push(item.word || item.answer);
    }
  });

  data.multi.forEach((item, index) => {
    const selected = document.querySelector(`input[name="multi-${index}"]:checked`);
    if (!selected || selected.value !== item.answer) {
      wrongAnswers.push(item.answer);
    }
  });

  data.fill.forEach((item, index) => {
    const input = document.querySelector(`input[name="fill-${index}"]`);
    if (!input || normaliseFill(input.value) !== normaliseFill(item.answer)) {
      wrongAnswers.push(item.answer);
    }
  });

  data.write.forEach((item, index) => {
    const input = document.querySelector(`textarea[name="write-${index}"]`);
    const text = input ? input.value.trim() : "";
    const model = item.model || `I will ${item.target} in this situation.`;
    const similarity = calcSimilarityPercent(text, model);
    if (similarity < 70) {
      wrongAnswers.push(item.target || item.answer || item.word || item.prompt);
    }
  });

  const unique = Array.from(new Set(wrongAnswers));
  reviewList.innerHTML = "";

  if (reviewTitle) {
    reviewTitle.classList.toggle("hidden", unique.length === 0);
  }

  if (unique.length === 0) {
    reviewList.textContent = "모든 문제를 맞췄습니다! 🎉";
    return;
  }

  reviewList.innerHTML = unique.map(word => `<div>${word}</div>`).join("");
}

function getSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(SUBMIT_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function getDraftByName(name) {
  if (!name) return null;
  const drafts = getDrafts();
  return drafts[name] || null;
}

function saveDraftByName(name, payload) {
  if (!name) return;
  try {
    const drafts = getDrafts();
    drafts[name] = payload;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (e) {}
}

function removeDraftByName(name) {
  if (!name) return;
  try {
    const drafts = getDrafts();
    delete drafts[name];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (e) {}
}

function getLatestSubmissionByName(name) {
  const list = getSubmissions().filter((item) => item && item.name === name);
  if (!list.length) return null;
  return list[list.length - 1];
}

function buildReviewListFromSubmission(data, submission) {
  if (!reviewList) return;
  const wrongAnswers = [];

  const answers = submission?.answers || {};
  const oxAnswers = Array.isArray(answers.ox) ? answers.ox : [];
  const multiAnswers = Array.isArray(answers.multi) ? answers.multi : [];
  const fillAnswers = Array.isArray(answers.fill) ? answers.fill : [];
  const writeAnswers = Array.isArray(answers.write) ? answers.write : [];

  data.ox.forEach((item, index) => {
    const selected = oxAnswers[index]?.answer || "";
    if (selected !== item.answer) {
      wrongAnswers.push(item.word || item.answer);
    }
  });

  data.multi.forEach((item, index) => {
    const selected = multiAnswers[index]?.answer || "";
    if (selected !== item.answer) {
      wrongAnswers.push(item.answer);
    }
  });

  data.fill.forEach((item, index) => {
    const value = fillAnswers[index]?.answer || "";
    if (normaliseFill(value) !== normaliseFill(item.answer)) {
      wrongAnswers.push(item.answer);
    }
  });

  data.write.forEach((item, index) => {
    const value = writeAnswers[index]?.answer || "";
    const model = item.model || `I will ${item.target} in this situation.`;
    const similarity = calcSimilarityPercent(value, model);
    if (similarity < 70) {
      wrongAnswers.push(item.target || item.answer || item.word || item.prompt);
    }
  });

  const unique = Array.from(new Set(wrongAnswers));
  reviewList.innerHTML = "";

  if (reviewTitle) {
    reviewTitle.classList.toggle("hidden", unique.length === 0);
  }

  if (unique.length === 0) {
    reviewList.textContent = "모든 문제를 맞췄습니다! 🎉";
    return;
  }

  reviewList.innerHTML = unique.map(word => `<div>${word}</div>`).join("");
}

function renderFullReview(data, answersSource) {
  if (!fullReview || !data) return;
  const answers = answersSource || {};
  fullReview.innerHTML = "";

  const oxAnswers = Array.isArray(answers.ox) ? answers.ox : [];
  const multiAnswers = Array.isArray(answers.multi) ? answers.multi : [];
  const fillAnswers = Array.isArray(answers.fill) ? answers.fill : [];
  const writeAnswers = Array.isArray(answers.write) ? answers.write : [];

  data.ox.forEach((item, index) => {
    const userAnswer = (oxAnswers[index]?.answer || "").trim();
    const correct = userAnswer === item.answer;
    const number = 1 + index;
    const row = document.createElement("div");
    row.className = "review-item";
    row.innerHTML = `
      <div class="review-title">${number}. ${item.sentence}</div>
      <div class="review-row">
        <div>정답 여부: <span class="${correct ? "correct" : "wrong"}">${correct ? "정답" : "오답"}</span></div>
        <div>내 답: <span class="${correct ? "correct" : "wrong"}">${escapeHTML(userAnswer || "(미작성)")}</span></div>
        <div>정답: <span class="correct">${escapeHTML(item.answer)}</span></div>
      </div>
    `;
    fullReview.appendChild(row);
  });

  data.multi.forEach((item, index) => {
    const userAnswer = (multiAnswers[index]?.answer || "").trim();
    const correct = userAnswer === item.answer;
    const number = 6 + index;
    const row = document.createElement("div");
    row.className = "review-item";
    row.innerHTML = `
      <div class="review-title">${number}. ${item.sentence}</div>
      <div class="review-row">
        <div>정답 여부: <span class="${correct ? "correct" : "wrong"}">${correct ? "정답" : "오답"}</span></div>
        <div>내 답: <span class="${correct ? "correct" : "wrong"}">${escapeHTML(userAnswer || "(미작성)")}</span></div>
        <div>정답: <span class="correct">${escapeHTML(item.answer)}</span></div>
      </div>
    `;
    fullReview.appendChild(row);
  });

  data.fill.forEach((item, index) => {
    const userAnswer = (fillAnswers[index]?.answer || "").trim();
    const correct = normaliseFill(userAnswer) === normaliseFill(item.answer);
    const number = 16 + index;
    const row = document.createElement("div");
    row.className = "review-item";

    if (number <= 18) {
      row.innerHTML = `
        <div class="review-title">${number}. ${item.sentence}</div>
        <div class="review-row">
          <div>정답 여부: <span class="${correct ? "correct" : "wrong"}">${correct ? "정답" : "오답"}</span></div>
          <div>내 답: <span class="${correct ? "correct" : "wrong"}">${escapeHTML(userAnswer || "(미작성)")}</span></div>
          <div>정답: <span class="correct">${escapeHTML(item.answer)}</span></div>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="review-title">${number}. ${item.sentence}</div>
        <div class="review-row">
          <div>정답 여부: <span class="${correct ? "correct" : "wrong"}">${correct ? "정답" : "오답"}</span></div>
          <div>답안은 비공개입니다.</div>
        </div>
      `;
    }
    fullReview.appendChild(row);
  });

  data.write.forEach((item, index) => {
    const userAnswer = (writeAnswers[index]?.answer || "").trim();
    const model = item.model || `I will ${item.target} in this situation.`;
    const similarity = calcSimilarityPercent(userAnswer, model);
    const correct = similarity >= 70;
    const number = 26 + index;
    const row = document.createElement("div");
    row.className = "review-item";
    row.innerHTML = `
      <div class="review-title">${number}. ${item.prompt}</div>
      <div class="review-row">
        <div>정답 여부: <span class="${correct ? "correct" : "wrong"}">${correct ? "정답" : "오답"}</span></div>
        <div>답안은 비공개입니다.</div>
      </div>
    `;
    fullReview.appendChild(row);
  });
}

function showStoredResult(submission) {
  const data = window.FINAL_QUESTIONS;
  if (!data || !submission) return;

  participantName = submission.name || participantName;

  if (scoreSummary) {
    const total = Number(submission.total ?? 0);
    const score = Number(submission.score ?? 0);
    scoreSummary.textContent = `${total}문항 중 ${score}문항 정답`;
  }
  if (scorePercent) {
    const total = Number(submission.total ?? 0);
    const score = Number(submission.score ?? 0);
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    scorePercent.textContent = `${percent}%`;
    if (scoreNameLine) {
      scoreNameLine.innerHTML = `<span class="name">${participantName || "참여자"}</span> 님 정답률`;
    }
  }

  if (writeReview) {
    writeReview.innerHTML = "";
    const writeAnswers = Array.isArray(submission.answers?.write)
      ? submission.answers.write
      : [];
    data.write.forEach((item, index) => {
      const text = (writeAnswers[index]?.answer || "").trim();
      const wrap = document.createElement("div");
      wrap.className = "write-item";
      const model = item.model || `I will ${item.target} in this situation.`;
      const similarity = calcSimilarityPercent(text, model);
      const writeNumber = 26 + index;
      const labelClass = similarity >= 70 ? "label good" : "label";
      wrap.innerHTML = `
        <div class="${labelClass}">${writeNumber}. 유사도 ${similarity}%</div>
        <div class="label">제출 답안</div>
        <div class="value">${highlightUserDiff(text, model)}</div>
        <div class="label">모범 답안</div>
        <div class="model">${escapeHTML(model)}</div>
      `;
      writeReview.appendChild(wrap);
    });
  }

  buildReviewListFromSubmission(data, submission);
  renderFullReview(data, submission.answers);

  if (resultModal) {
    resultModal.classList.remove("hidden");
    resultModal.style.display = "flex";
  }
  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
}

function populateExamWithSubmission(submission, options = {}) {
  const data = window.FINAL_QUESTIONS;
  if (!data || !submission) return;
  const shouldDisable = options.disable === true;

  const answers = submission.answers || {};
  const oxAnswers = Array.isArray(answers.ox) ? answers.ox : [];
  const multiAnswers = Array.isArray(answers.multi) ? answers.multi : [];
  const fillAnswers = Array.isArray(answers.fill) ? answers.fill : [];
  const writeAnswers = Array.isArray(answers.write) ? answers.write : [];

  data.ox.forEach((item, index) => {
    const value = oxAnswers[index]?.answer || "";
    if (!value) return;
    const input = document.querySelector(
      `input[name="ox-${index}"][value="${value}"]`
    );
    if (input) input.checked = true;
  });

  data.multi.forEach((item, index) => {
    const value = multiAnswers[index]?.answer || "";
    if (!value) return;
    const input = document.querySelector(
      `input[name="multi-${index}"][value="${value}"]`
    );
    if (input) input.checked = true;
  });

  data.fill.forEach((item, index) => {
    const value = fillAnswers[index]?.answer || "";
    const input = document.querySelector(`input[name="fill-${index}"]`);
    if (input) input.value = value;
  });

  data.write.forEach((item, index) => {
    const value = writeAnswers[index]?.answer || "";
    const input = document.querySelector(`textarea[name="write-${index}"]`);
    if (input) input.value = value;
  });

  if (examForm && shouldDisable) {
    Array.from(examForm.elements).forEach((el) => {
      el.disabled = true;
    });
  }
}

function collectAnswersSnapshot() {
  const data = window.FINAL_QUESTIONS;
  if (!data) return { ox: [], multi: [], fill: [], write: [] };
  return collectAnswers();
}

function saveDraftSnapshot() {
  if (!participantName) return;
  const answers = collectAnswersSnapshot();
  const payload = {
    name: participantName,
    score: 0,
    total: 25,
    submittedAt: null,
    answers
  };
  saveDraftByName(participantName, payload);
}

function debounce(fn, delay = 600) {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(), delay);
  };
}

const debouncedDraftSave = debounce(saveDraftSnapshot, 600);

function setupAutosave() {
  if (!examForm) return;
  examForm.addEventListener("change", debouncedDraftSave);
  examForm.addEventListener("input", debouncedDraftSave);
}

function getReviewText() {
  if (!reviewList) return "";
  const items = Array.from(reviewList.querySelectorAll("div"))
    .map((el) => el.textContent.trim())
    .filter(Boolean);
  if (items.length === 0) return "";
  return items.join("\n");
}

async function copyReviewText() {
  const text = getReviewText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (err) {}
    document.body.removeChild(textarea);
  }
}

function emailReviewText() {
  const text = getReviewText();
  if (!text) return;
  const subject = encodeURIComponent("Final Test 복습 단어");
  const body = encodeURIComponent(text);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

if (copyReviewBtn) {
  copyReviewBtn.addEventListener("click", copyReviewText);
}

if (emailReviewBtn) {
  emailReviewBtn.addEventListener("click", emailReviewText);
}

function autofillExam(data, ratio) {
  const total = 25;
  const correctTarget = Math.max(0, Math.min(total, Math.round(total * ratio)));
  let correctCount = 0;

  data.ox.forEach((item, index) => {
    const choice = document.querySelectorAll(`input[name="ox-${index}"]`);
    const pickCorrect = correctCount < correctTarget;
    const value = pickCorrect ? item.answer : (item.answer === "O" ? "X" : "O");
    choice.forEach((el) => {
      if (el.value === value) el.checked = true;
    });
    if (pickCorrect) correctCount++;
  });

  data.multi.forEach((item, index) => {
    const choice = document.querySelectorAll(`input[name="multi-${index}"]`);
    const pickCorrect = correctCount < correctTarget;
    const wrong = item.options.find(opt => opt !== item.answer) || item.answer;
    const value = pickCorrect ? item.answer : wrong;
    choice.forEach((el) => {
      if (el.value === value) el.checked = true;
    });
    if (pickCorrect) correctCount++;
  });

  data.fill.forEach((item, index) => {
    const input = document.querySelector(`input[name="fill-${index}"]`);
    if (!input) return;
    const pickCorrect = correctCount < correctTarget;
    input.value = pickCorrect ? item.answer : "wrong answer";
    if (pickCorrect) correctCount++;
  });

  data.write.forEach((item, index) => {
    const input = document.querySelector(`textarea[name="write-${index}"]`);
    if (input) {
      input.value = item.model || `I will ${item.target} in this situation.`;
    }
  });
}

if (examForm) {
  examForm.addEventListener("submit", (e) => {
    e.preventDefault();
    scoreExam();
  });
}

function getUsedNames() {
  try {
    return JSON.parse(localStorage.getItem(USED_NAME_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function addUsedName(name) {
  const used = getUsedNames();
  if (!used.includes(name)) {
    used.push(name);
    localStorage.setItem(USED_NAME_KEY, JSON.stringify(used));
  }
}

function isNameAllowed(name) {
  if (!name) return false;
  if (name === "유버디2") return true;
  if (name === DEV_CODE) return true;
  if (ALLOWED_NAMES.length === 0) return true;
  return ALLOWED_NAMES.includes(name);
}

function showDevCodeError(text) {
  if (!devCodeError) return;
  devCodeError.textContent = text || "";
}

function showNameError(text) {
  if (!nameError) return;
  nameError.textContent = text || "";
}

function showCompletionModal() {
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
  if (completionModal) {
    completionModal.classList.remove("hidden");
    completionModal.style.display = "flex";
  }
  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
}

function startExam() {
  if (nameGate) nameGate.classList.add("hidden");
  if (examForm) examForm.classList.remove("hidden");
  renderExam();
  setupAutosave();
}

function collectAnswers() {
  const data = window.FINAL_QUESTIONS;
  if (!data) return {};

  const answers = { ox: [], multi: [], fill: [], write: [] };

  data.ox.forEach((item, index) => {
    const selected = document.querySelector(`input[name="ox-${index}"]:checked`);
    answers.ox.push({ answer: selected ? selected.value : "" });
  });

  data.multi.forEach((item, index) => {
    const selected = document.querySelector(`input[name="multi-${index}"]:checked`);
    answers.multi.push({ answer: selected ? selected.value : "" });
  });

  data.fill.forEach((item, index) => {
    const input = document.querySelector(`input[name="fill-${index}"]`);
    answers.fill.push({ answer: input ? input.value.trim() : "" });
  });

  data.write.forEach((item, index) => {
    const input = document.querySelector(`textarea[name="write-${index}"]`);
    answers.write.push({ answer: input ? input.value.trim() : "" });
  });

  return answers;
}

async function saveSubmission(payload) {
  if (SUBMIT_ENDPOINT) {
    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) return;
      throw new Error("Remote submit failed");
    } catch (e) {
      // fall through to local storage
    }
  }

  try {
    const existing = JSON.parse(localStorage.getItem(SUBMIT_KEY) || "[]");
    const filtered = existing.filter((item) => item && item.name !== payload.name);
    filtered.push(payload);
    localStorage.setItem(SUBMIT_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

if (nameForm) {
  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (nameInput ? nameInput.value : "").trim();

    if (!name) {
      showNameError("이름을 입력해 주세요.");
      return;
    }

    if (!isNameAllowed(name)) {
      showNameError("등록되지 않은 이름입니다.");
      return;
    }

    const latestSubmission = getLatestSubmissionByName(name);
    if (latestSubmission) {
      showNameError("");
      startExam();
      populateExamWithSubmission(latestSubmission, { disable: true });
      showStoredResult(latestSubmission);
      return;
    }

    const draftSubmission = getDraftByName(name);
    if (draftSubmission) {
      participantName = name;
      showNameError("");
      startExam();
      populateExamWithSubmission(draftSubmission, { disable: false });
      return;
    }

    if (getUsedNames().includes(name)) {
      if (name === "유버디2" || name === DEV_CODE) {
        showNameError("");
        startExam();
        return;
      }
      showNameError("");
      showCompletionModal();
      return;
    }

    participantName = name;
    addUsedName(name);
    showNameError("");
    startExam();
    saveDraftSnapshot();
  });
}

if (devCodeForm) {
  devCodeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = (devCodeInput ? devCodeInput.value : "").trim();
    if (code === DEV_CODE) {
      showDevCodeError("");
      if (devCodeInput) devCodeInput.value = "";
      showNameGate();
      return;
    }
    showDevCodeError("코드가 올바르지 않습니다.");
  });
}

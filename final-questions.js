// final-questions.js

(function () {
  const SOURCE =
    (typeof QUESTIONS !== "undefined" && Array.isArray(QUESTIONS))
      ? QUESTIONS
      : [];

  function cleanMeaning(text) {
    return (text || "").replace(/^\s*\d+\.\s*/, "").trim();
  }

  const fixedSource = SOURCE.filter(item => item.answer);
  const totalNeeded = 30;
  const truthPattern = [true, false, true, false, true];
  const usedMeanings = new Set();

  const usedIndices = new Set();
  const oxBase = [];
  for (let i = 0; i < fixedSource.length && oxBase.length < 5; i++) {
    const meaning = cleanMeaning(fixedSource[i].meaning);
    if (!meaning) continue;
    if (!usedMeanings.has(meaning)) {
      oxBase.push(fixedSource[i]);
      usedIndices.add(i);
      usedMeanings.add(meaning);
    }
  }

  function seededShuffle(list, seed) {
    const copy = [...list];
    let x = seed >>> 0;
    for (let i = copy.length - 1; i > 0; i--) {
      x = (x * 1664525 + 1013904223) >>> 0;
      const j = x % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const remaining = fixedSource.filter((_, idx) => !usedIndices.has(idx));
  const picked = remaining.slice(0, totalNeeded - oxBase.length);
  const fixedOrder = seededShuffle(picked, 777);

  const multiBase = fixedOrder.slice(0, 10);
  const fillBase = fixedOrder.slice(10, 20);
  const writeBase = fixedOrder.slice(20, 25);

  function getMeaningPool() {
    const pool = fixedSource
      .map(item => cleanMeaning(item.meaning))
      .filter(text => text);
    return Array.from(new Set(pool));
  }

  function pickUniqueMeaning(excludeMeaning, seed) {
    const pool = getMeaningPool()
      .filter(text => text !== excludeMeaning && !usedMeanings.has(text));
    if (pool.length === 0) return null;
    const pick = seededShuffle(pool, seed)[0];
    return pick || null;
  }

  function buildSentence(item) {
    return `${item.prefix} ${item.answer} ${item.suffix}`.replace(/\s+/g, " ").trim();
  }

  const ox = oxBase.map((item, index) => {
    let shouldBeTrue = truthPattern[index % truthPattern.length];
    const correctMeaning = cleanMeaning(item.meaning);
    let meaning = correctMeaning;
    if (!shouldBeTrue) {
      const picked = pickUniqueMeaning(correctMeaning, index + 11);
      if (picked) {
        meaning = picked;
      } else {
        shouldBeTrue = true;
        meaning = correctMeaning;
      }
    }
    if (!usedMeanings.has(meaning)) {
      usedMeanings.add(meaning);
    }
    return {
      sentence: `${item.prefix} ${item.answer} ${item.suffix}`.replace(/\s+/g, " ").trim(),
      meaning,
      answer: shouldBeTrue ? "O" : "X",
      word: item.answer
    };
  });

  const multi = multiBase.map((item, index) => {
    const baseIndex = 5 + index;
    const distractors = [
      fixedSource[(baseIndex + 1) % fixedSource.length],
      fixedSource[(baseIndex + 2) % fixedSource.length],
      fixedSource[(baseIndex + 3) % fixedSource.length]
    ]
      .filter(Boolean)
      .map(x => x.answer);

    const options = seededShuffle([item.answer, ...distractors], index + 21);
    return {
      sentence: `${item.prefix} ____ ${item.suffix}`.replace(/\s+/g, " ").trim(),
      translation: item.translation || "",
      options,
      answer: item.answer
    };
  });

  const fill = fillBase.map(item => ({
    sentence: `${item.prefix} ____ ${item.suffix}`.replace(/\s+/g, " ").trim(),
    translation: item.translation || "",
    answer: item.answer
  }));

  const write = writeBase.map(item => ({
    prompt: item.translation || "다음 표현을 사용해 문장을 만들어 보세요.",
    target: item.answer,
    model: buildSentence(item)
  }));

  window.FINAL_QUESTIONS = { ox, multi, fill, write };
})();

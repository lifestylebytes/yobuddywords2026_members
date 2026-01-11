// questions.js

const QUESTIONS = [
  {
    answer: "helter-skelter",
    prefix: "We’re all on the same project right now, so things are a little",
    suffix: ".",
    meaning: "2. 우왕좌왕 / 뒤죽박죽 / 정신없음",
    translation: "지금 다 같이 같은 프로젝트를 하다 보니 좀 정신없어요.",
    addedDate: "2026-01-03"
  },
  {
    answer: "get the ball rolling",
    prefix: "We’ll",
    suffix: "on this as our first project in 2026.",
    meaning: "1. 일을 시작하다 / 본격적으로 착수하다",
    translation: "2026년에 첫 프로젝트로 이걸 시작할게요.",
    addedDate: "2026-01-02"
  },
  {
    answer: "stall out",
    prefix: "The decision seems to have",
    suffix: ".",
    meaning: "의사결정이 정체되다",
    translation: "의사결정이 중간에서 멈춘 상태예요.",
    addedDate: "2026-01-22"
  },
  {
    answer: "see it through",
    prefix: "Let’s",
    suffix: "once we commit.",
    meaning: "논리를 끝까지 밀고 가다",
    translation: "중간에 포기하지 말고 끝까지 가야 해요.",
    addedDate: "2026-01-28"
  },
  {
    answer: "warrants further review",
    prefix: "This issue",
    suffix: ".",
    meaning: "추가 검토가 필요하다",
    translation: "이 이슈는 추가 검토가 필요해 보여요.",
    addedDate: "2026-01-14"
  },
  {
    answer: "get a clear read on",
    prefix: "I want to",
    suffix: "on the timeline before committing.",
    meaning: "5. 상황을 명확히 파악하다",
    translation: "확정하기 전에 일정 상황을 명확히 파악하고 싶어요.",
    addedDate: "2026-01-06"
  },
  {
    answer: "false premise",
    prefix: "The argument is built on a",
    suffix: ".",
    meaning: "애초에 성립하지 않는 가정",
    translation: "그 논의는 잘못된 전제를 바탕으로 하고 있어요.",
    addedDate: "2026-01-31"
  },
  {
    answer: "lag behind",
    prefix: "The documentation is",
    suffix: "the actual work.",
    meaning: "뒤처지다",
    translation: "문서가 실제 작업보다 뒤처져 있어요.",
    addedDate: "2026-01-10"
  },
  {
    answer: "for context",
    prefix: "",
    suffix: ", this decision was made last quarter.",
    meaning: "맥락 설명을 하자면",
    translation: "맥락 설명을 하자면 이 결정은 지난 분기에 내려졌어요.",
    addedDate: "2026-01-13"
  },
  {
    answer: "in the grand scheme of things",
    prefix: "",
    suffix: ", this delay won’t matter much.",
    meaning: "3. 큰 그림에서 보면 / 전체 맥락에서",
    translation: "큰 흐름에서 보면 이 지연은 큰 문제가 아닙니다.",
    addedDate: "2026-01-04"
  },
  {
    answer: "too many stakeholders",
    prefix: "Progress is slow because there are",
    suffix: ".",
    meaning: "이해관계자가 많다",
    translation: "결정이 느린 이유예요.",
    addedDate: "2026-01-27"
  },
  {
    answer: "sharpen the focus",
    prefix: "We need to",
    suffix: "before the next review.",
    meaning: "논점을 명확히 하다",
    translation: "논점을 조금 더 명확히 해야 할 것 같아요.",
    addedDate: "2026-01-21"
  },
  {
    answer: "fix at the root",
    prefix: "We should",
    suffix: "instead of patching it.",
    meaning: "문제를 근본적으로 해결하다",
    translation: "임시방편 말고 근본 해결이 필요해요.",
    addedDate: "2026-01-26"
  },
  {
    answer: "get traction",
    prefix: "This proposal hasn’t really",
    suffix: "yet.",
    meaning: "논의를 본궤도로 올리다",
    translation: "아직 이 안건은 논의가 본격화되지 않았어요.",
    addedDate: "2026-01-20"
  },
  {
    answer: "go off on a tangent",
    prefix: "We tend to",
    suffix: "during these discussions.",
    meaning: "논점에서 벗어나다",
    translation: "중요한 논의 중에 자꾸 딴 얘기로 새요.",
    addedDate: "2026-01-30"
  },
  {
    answer: "key takeaway",
    prefix: "The",
    suffix: "from this meeting is alignment.",
    meaning: "핵심 요점",
    translation: "이번 미팅의 핵심 요점은 정렬입니다.",
    addedDate: "2026-01-12"
  },
  {
    answer: "bottleneck",
    prefix: "The biggest",
    suffix: "right now is QA.",
    meaning: "6. 병목 구간 / 막히는 지점",
    translation: "지금 가장 큰 병목은 QA입니다.",
    addedDate: "2026-01-07"
  },
  {
    answer: "ease the load",
    prefix: "Splitting the work will",
    suffix: ".",
    meaning: "부담을 줄이다",
    translation: "작업을 나누면 부담이 줄어요.",
    addedDate: "2026-01-15"
  },
  {
    answer: "might be redundant",
    prefix: "",
    suffix: ", I’ll share it again.",
    meaning: "이미 들은 내용일 수도 있지만",
    translation: "이미 들으셨을 수도 있지만 다시 공유할게요.",
    addedDate: "2026-01-11"
  },
  {
    answer: "on the surface",
    prefix: "",
    suffix: ", everything looks fine, but we should double-check.",
    meaning: "4. 겉으로 보기에는",
    translation: "겉으로 보기엔 괜찮아 보이지만 다시 확인해봐야 해요.",
    addedDate: "2026-01-05"
  },
  {
    answer: "hand off",
    prefix: "We’ll",
    suffix: "this task to the next team.",
    meaning: "7. 작업을 인계하다",
    translation: "이 작업은 다음 팀에 인계할게요.",
    addedDate: "2026-01-08"
  },
  {
    answer: "kick the can down the road",
    prefix: "We keep",
    suffix: "instead of addressing the root issue.",
    meaning: "결정을 미루다 / 차일피일 넘기다",
    translation: "근본 해결 없이 결정을 계속 미루고 있어요.",
    addedDate: "2026-01-29"
  },
  {
    answer: "push back gently",
    prefix: "I’d like to",
    suffix: "on that assumption.",
    meaning: "조심스럽게 반대 의견을 내다",
    translation: "강하게는 아니지만 반대는 해야 할 것 같아요.",
    addedDate: "2026-01-24"
  },
  {
    answer: "build in buffer time",
    prefix: "Let’s",
    suffix: "for safety.",
    meaning: "완충 시간을 두다",
    translation: "리스크 대비해서 일정에 여유를 두죠.",
    addedDate: "2026-01-16"
  },
  {
    answer: "fall through the cracks",
    prefix: "This task",
    suffix: "during the handoff.",
    meaning: "완전히 빠져 있다",
    translation: "이 이슈가 아무도 챙기지 않아 빠졌어요.",
    addedDate: "2026-01-23"
  },
  {
    answer: "nitpick",
    prefix: "I don’t want to",
    suffix: ", but this could cause issues later.",
    meaning: "사소해 보이지만 중요한 문제",
    translation: "사소한 부분처럼 보이지만 나중에 문제 될 수 있어요.",
    addedDate: "2026-01-18"
  },
  {
    answer: "out of scope",
    prefix: "That request is",
    suffix: "for this sprint.",
    meaning: "8. 범위를 벗어난",
    translation: "그 요청은 이번 스프린트 범위를 벗어납니다.",
    addedDate: "2026-01-09"
  },
  {
    answer: "scramble",
    prefix: "I don’t want us to",
    suffix: ".",
    meaning: "막판에 허둥대다",
    translation: "막판에 허둥대지 않았으면 해요.",
    addedDate: "2026-01-17"
  },
  {
    answer: "skirt around",
    prefix: "It felt like we were",
    suffix: "the main issue.",
    meaning: "말을 에둘러 하다 / 핵심을 피하다",
    translation: "핵심을 피해서 이야기하는 느낌이었어요.",
    addedDate: "2026-01-19"
  },
  {
    answer: "scope creep",
    prefix: "This is starting to feel like",
    suffix: ".",
    meaning: "일의 범위를 슬금슬금 늘리다",
    translation: "요구사항이 점점 늘고 있어요.",
    addedDate: "2026-01-25"
  }
];

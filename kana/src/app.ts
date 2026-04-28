import { KANA, type KanaSet } from "./kana";

type Script = "hiragana" | "katakana";
type Theme = "paper" | "laser";

type StudyCard = {
  symbol: string;
  romaji: string;
  script: Script;
  set: KanaSet;
};

type AppState = {
  cards: StudyCard[];
  index: number;
  revealed: boolean;
  graded: boolean;
  correct: number;
  seen: number;
  streak: number;
};

const state: AppState = {
  cards: [],
  index: 0,
  revealed: false,
  graded: false,
  correct: 0,
  seen: 0,
  streak: 0,
};

const elements = {
  hiraganaToggle: getElement<HTMLInputElement>("#hiragana-toggle"),
  katakanaToggle: getElement<HTMLInputElement>("#katakana-toggle"),
  basicToggle: getElement<HTMLInputElement>("#basic-toggle"),
  dakutenToggle: getElement<HTMLInputElement>("#dakuten-toggle"),
  comboToggle: getElement<HTMLInputElement>("#combo-toggle"),
  shuffleButton: getElement<HTMLButtonElement>("#shuffle-button"),
  resetButton: getElement<HTMLButtonElement>("#reset-button"),
  flashcard: getElement<HTMLButtonElement>("#flashcard"),
  kanaSymbol: getElement<HTMLSpanElement>("#kana-symbol"),
  answerText: getElement<HTMLSpanElement>("#answer-text"),
  scriptLabel: getElement<HTMLSpanElement>("#script-label"),
  setLabel: getElement<HTMLSpanElement>("#set-label"),
  answerForm: getElement<HTMLFormElement>("#answer-form"),
  answerInput: getElement<HTMLInputElement>("#answer-input"),
  feedback: getElement<HTMLParagraphElement>("#feedback"),
  knowButton: getElement<HTMLButtonElement>("#know-button"),
  missButton: getElement<HTMLButtonElement>("#miss-button"),
  nextButton: getElement<HTMLButtonElement>("#next-button"),
  themeSelect: getElement<HTMLSelectElement>("#theme-select"),
  correctCount: getElement<HTMLElement>("#correct-count"),
  seenCount: getElement<HTMLElement>("#seen-count"),
  streakCount: getElement<HTMLElement>("#streak-count"),
};

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function getEnabledScripts(): Script[] {
  return [
    elements.hiraganaToggle.checked ? "hiragana" : null,
    elements.katakanaToggle.checked ? "katakana" : null,
  ].filter((script): script is Script => script !== null);
}

function getEnabledSets(): KanaSet[] {
  return [
    elements.basicToggle.checked ? "basic" : null,
    elements.dakutenToggle.checked ? "dakuten" : null,
    elements.comboToggle.checked ? "combo" : null,
  ].filter((set): set is KanaSet => set !== null);
}

function buildDeck(): void {
  const scripts = getEnabledScripts();
  const sets = getEnabledSets();

  if (scripts.length === 0) {
    elements.hiraganaToggle.checked = true;
    scripts.push("hiragana");
  }

  if (sets.length === 0) {
    elements.basicToggle.checked = true;
    sets.push("basic");
  }

  state.cards = KANA
    .filter((card) => sets.includes(card.set))
    .flatMap((card) =>
      scripts.map((script) => ({
        symbol: card[script],
        romaji: card.romaji,
        script,
        set: card.set,
      })),
    );

  shuffleDeck();
}

function shuffleDeck(): void {
  for (let i = state.cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.cards[i], state.cards[j]] = [state.cards[j], state.cards[i]];
  }

  state.index = 0;
  state.revealed = false;
  state.graded = false;
  renderCard();
}

function currentCard(): StudyCard {
  return state.cards[state.index];
}

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderCard(): void {
  const card = currentCard();

  elements.kanaSymbol.textContent = card.symbol;
  elements.answerText.textContent = card.romaji;
  elements.answerText.hidden = !state.revealed;
  elements.scriptLabel.textContent = formatLabel(card.script);
  elements.setLabel.textContent = card.set === "combo" ? "Combination" : formatLabel(card.set);
  elements.answerInput.value = "";
  elements.feedback.textContent = "Press the card to reveal, or type an answer.";
  elements.feedback.className = "feedback";
  elements.correctCount.textContent = String(state.correct);
  elements.seenCount.textContent = String(state.seen);
  elements.streakCount.textContent = String(state.streak);
  elements.flashcard.classList.toggle("is-revealed", state.revealed);
  elements.answerInput.focus();
}

function revealCard(message = `Answer: ${currentCard().romaji}`, tone = "is-neutral"): void {
  state.revealed = true;
  elements.answerText.hidden = false;
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${tone}`;
  elements.flashcard.classList.add("is-revealed");
}

function gradeCard(wasCorrect: boolean): void {
  if (state.graded) {
    nextCard();
    return;
  }

  state.graded = true;
  state.seen += 1;

  if (wasCorrect) {
    state.correct += 1;
    state.streak += 1;
    elements.feedback.textContent = "Nice. That one counts as known.";
    elements.feedback.className = "feedback is-correct";
  } else {
    revealCard(`Missed. The answer is ${currentCard().romaji}.`);
    state.streak = 0;
    elements.feedback.className = "feedback is-incorrect";
  }

  elements.correctCount.textContent = String(state.correct);
  elements.seenCount.textContent = String(state.seen);
  elements.streakCount.textContent = String(state.streak);
}

function nextCard(): void {
  state.index = (state.index + 1) % state.cards.length;
  state.revealed = false;
  state.graded = false;
  renderCard();
}

function checkAnswer(answer: string): void {
  const normalized = answer.trim().toLowerCase();

  if (!normalized) {
    revealCard();
    return;
  }

  if (normalized === currentCard().romaji) {
    if (state.graded) {
      return;
    }

    state.graded = true;
    state.seen += 1;
    state.correct += 1;
    state.streak += 1;
    revealCard(`Correct: ${currentCard().symbol} is ${currentCard().romaji}.`, "is-correct");
    elements.correctCount.textContent = String(state.correct);
    elements.seenCount.textContent = String(state.seen);
    elements.streakCount.textContent = String(state.streak);
    setTimeout(nextCard, 550);
    return;
  }

  if (state.graded) {
    return;
  }

  state.graded = true;
  state.seen += 1;
  state.streak = 0;
  revealCard(`Not quite. ${currentCard().symbol} is ${currentCard().romaji}.`, "is-incorrect");
  elements.correctCount.textContent = String(state.correct);
  elements.seenCount.textContent = String(state.seen);
  elements.streakCount.textContent = String(state.streak);
}

function resetSession(): void {
  state.correct = 0;
  state.seen = 0;
  state.streak = 0;
  buildDeck();
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("kana-theme", theme);
}

function getSavedTheme(): Theme {
  return localStorage.getItem("kana-theme") === "laser" ? "laser" : "paper";
}

elements.flashcard.addEventListener("click", () => revealCard());
elements.shuffleButton.addEventListener("click", shuffleDeck);
elements.resetButton.addEventListener("click", resetSession);
elements.knowButton.addEventListener("click", () => gradeCard(true));
elements.missButton.addEventListener("click", () => gradeCard(false));
elements.nextButton.addEventListener("click", nextCard);

elements.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  checkAnswer(elements.answerInput.value);
});

elements.themeSelect.addEventListener("change", () => {
  applyTheme(elements.themeSelect.value === "laser" ? "laser" : "paper");
});

[
  elements.hiraganaToggle,
  elements.katakanaToggle,
  elements.basicToggle,
  elements.dakutenToggle,
  elements.comboToggle,
].forEach((control) => {
  control.addEventListener("change", buildDeck);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    nextCard();
  }

  if (event.key === " " && document.activeElement !== elements.answerInput) {
    event.preventDefault();
    revealCard();
  }
});

const savedTheme = getSavedTheme();
elements.themeSelect.value = savedTheme;
applyTheme(savedTheme);
buildDeck();

export interface ParsedFaqItem {
  question: string;
  answer: string;
}

const QA_MARKER = /(?:^|\n)[ \t]*(?:Q(?:uestion)?|Câu hỏi)[ \t]*[:.\-][ \t]*/i;
const A_MARKER = /\n[ \t]*(?:A(?:nswer)?|Trả lời)[ \t]*[:.\-][ \t]*/i;

// Handles two common paste shapes:
// 1. Explicit "Q: ... / A: ..." (or "Question:"/"Câu hỏi:" + "Answer:"/"Trả lời:") markers.
// 2. Plain blocks separated by a blank line, where the first line is the
//    question and the remaining lines are the answer.
export function parseFaqPaste(raw: string): ParsedFaqItem[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  if (QA_MARKER.test(text)) {
    const chunks = text.split(new RegExp(`\\n(?=[ \\t]*(?:Q(?:uestion)?|Câu hỏi)[ \\t]*[:.\\-])`, "i"));
    return chunks
      .map((chunk) => {
        const withoutQMarker = chunk.replace(QA_MARKER, "").trim();
        const answerSplit = withoutQMarker.match(A_MARKER);
        if (!answerSplit || answerSplit.index === undefined) return null;
        const question = withoutQMarker.slice(0, answerSplit.index).trim();
        const answer = withoutQMarker.slice(answerSplit.index + answerSplit[0].length).trim();
        if (!question || !answer) return null;
        return { question, answer };
      })
      .filter((item): item is ParsedFaqItem => item !== null);
  }

  return text
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2) return null;
      return { question: lines[0], answer: lines.slice(1).join(" ") };
    })
    .filter((item): item is ParsedFaqItem => item !== null);
}

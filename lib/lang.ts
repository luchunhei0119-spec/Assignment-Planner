'use client';
import { useState, useEffect, useCallback } from 'react';

export type Lang = 'zh' | 'en';

const strings = {
  // Nav
  backToDashboard: { zh: '← 返回主頁', en: '← Back to Dashboard' },
  settings: { zh: '設定', en: 'Settings' },

  // Dashboard
  appTitle: { zh: '功課計劃助手', en: 'Assignment Planner' },
  appSubtitle: { zh: 'AI 智能學習規劃', en: 'AI-powered study planning' },
  history: { zh: '歷史記錄', en: 'History' },
  analyzeDoc: { zh: '分析文件', en: 'Analyze Doc' },
  quiz: { zh: '測驗', en: 'Quiz' },
  translate: { zh: '翻譯', en: 'Translate' },
  importSyllabus: { zh: '匯入課程大綱', en: 'Import Syllabus' },
  total: { zh: '總計', en: 'Total' },
  dueSoon: { zh: '即將到期', en: 'Due soon' },
  completed: { zh: '已完成', en: 'Completed' },
  filterAll: { zh: '全部', en: 'All' },
  filterUpcoming: { zh: '待完成', en: 'Upcoming' },
  filterDone: { zh: '已完成', en: 'Done' },
  noAssignments: { zh: '暫無功課', en: 'No assignments yet' },
  noAssignmentsDesc: { zh: '貼上課程大綱，AI 會自動提取所有功課。', en: 'Paste your syllabus and AI will extract all your assignments.' },
  noCategoryItems: { zh: '此分類暫無功課。', en: 'No assignments in this category.' },
  daysLeft: { zh: (d: number) => `還有 ${d} 天`, en: (d: number) => `${d}d left` },
  dueToday: { zh: '今日截止', en: 'Due today' },
  overdue: { zh: '已逾期', en: 'Overdue' },
  tasks: { zh: (done: number, total: number) => `${done}/${total} 個任務`, en: (done: number, total: number) => `${done}/${total} tasks` },
  wrongAnswers: { zh: '錯題本', en: 'Wrong Answers' },
  questionsToReview: { zh: (n: number) => `${n} 條題目待複習`, en: (n: number) => `${n} questions to review` },
  recentAnalyses: { zh: '最近分析記錄', en: 'Recent Analyses' },
  newAnalysis: { zh: '+ 新增', en: '+ New' },
  keyPoints: { zh: (n: number) => `${n} 個重點`, en: (n: number) => `${n} key points` },
  flashcards: { zh: '閃卡', en: 'Flashcards' },
  deleteAssignment: { zh: '確定刪除此功課？', en: 'Delete this assignment?' },

  // Import
  importTitle: { zh: '從課程大綱匯入', en: 'Import from Syllabus' },
  importDesc: { zh: '貼上你的課程大綱，AI 會自動提取所有功課及截止日期。', en: 'Paste your course syllabus and AI will extract all assignments and deadlines.' },
  readingFiles: { zh: '正在讀取檔案...', en: 'Reading files...' },
  clickAddMore: { zh: '點擊新增更多檔案', en: 'Click to add more files' },
  uploadFiles: { zh: '上載 PDF、Word 或 TXT 檔案', en: 'Upload PDF, Word, or TXT files' },
  dragDrop: { zh: '可選擇多個檔案或拖放至此', en: 'Select multiple files or drag and drop' },
  orPasteText: { zh: '或貼上文字', en: 'or paste text' },
  pasteHere: { zh: '在此貼上課程大綱文字...', en: 'Paste your syllabus text here...' },
  extracting: { zh: '正在提取...', en: 'Extracting...' },
  extractBtn: { zh: 'AI 提取功課', en: 'Extract Assignments with AI' },
  foundAssignments: { zh: (n: number) => `找到 ${n} 個功課 — 選擇要匯入的`, en: (n: number) => `Found ${n} assignments — select which to import` },
  selected: { zh: (n: number) => `${n} 個已選`, en: (n: number) => `${n} selected` },
  dueDate: { zh: '截止', en: 'Due' },
  importBtn: { zh: (n: number) => `匯入 ${n} 個功課`, en: (n: number) => `Import ${n} Assignments` },

  // Analyze
  analyzeTitle: { zh: '分析文件', en: 'Analyze Document' },
  analyzeDesc: { zh: '上載或貼上任何文件，AI 會為你摘要並標出重點。', en: 'Upload or paste any document — AI will summarize it and highlight the key points.' },
  pasteDocHere: { zh: '在此貼上文件內容...', en: 'Paste your document text here...' },
  keyPointsSlider: { zh: '重點數量：', en: 'Key points:' },
  generatingSummary: { zh: '正在生成摘要...', en: 'Generating summary...' },
  extractingKeyPoints: { zh: '正在提取重點...', en: 'Extracting key points...' },
  analyzing: { zh: '正在分析...', en: 'Analyzing...' },
  analyzeBtn: { zh: 'AI 分析', en: 'Analyze with AI' },
  summary: { zh: '摘要', en: 'Summary' },
  keyPointsTitle: { zh: '重點', en: 'Key Points' },
  tapToExpand: { zh: '點擊每個重點查看詳細解釋', en: 'Tap each point for details' },
  loadingKeyPoints: { zh: '正在提取重點...', en: 'Extracting key points...' },
  fullTextHighlights: { zh: '原文重點標示', en: 'Full Text with Highlights' },
  askTitle: { zh: '向 AI 提問', en: 'Ask about this document' },
  askSubtitle: { zh: '中英對照回答', en: 'Bilingual answers' },
  askPlaceholder: { zh: '輸入任何關於文件的問題...', en: 'Ask a question about this document...' },
  askPrompt: { zh: '問任何關於文件嘅問題', en: 'Ask anything about the document' },
  send: { zh: '發送', en: 'Send' },
  giveExample: { zh: '俾我一個例子', en: 'Give me an example' },
  explainMore: { zh: '詳細解釋', en: 'Explain in more depth' },
  sugQ1: { zh: '總結主要論點', en: 'Summarize the main argument' },
  sugQ2: { zh: '最重要的概念係咩？', en: 'What are the most important concepts?' },
  sugQ3: { zh: '俾一個實際例子', en: 'Give me a real-world example' },

  // Dashboard — missing keys
  wrongToReview: { zh: '題待複習', en: 'to review' },
  keyPointsCount: { zh: '個重點', en: 'key points' },

  // History — missing keys
  recordsCount: { zh: '條記錄', en: 'records saved' },
  noResults: { zh: '找不到結果', en: 'No results found' },

  // Analyze — missing keys
  extractingKP: { zh: '正在提取重點...', en: 'Extracting key points...' },
  fullText: { zh: '原文重點標示', en: 'Full Text with Highlights' },

  // Quiz { zh: '測驗生成器', en: 'Quiz Generator' },
  quizDesc: { zh: '上載你的筆記，AI 會生成題目測試你的知識。', en: 'Upload your notes and AI will generate questions to test your knowledge.' },
  questionType: { zh: '題目類型', en: 'Question Type' },
  mcLabel: { zh: '選擇題', en: 'Multiple Choice' },
  mcDesc: { zh: '4 個選項，點擊作答', en: '4 options, click to answer' },
  shortLabel: { zh: '簡答題', en: 'Short Question' },
  shortDesc: { zh: '1-3 句回答', en: '1–3 sentence answer' },
  longLabel: { zh: '長答題', en: 'Long Question' },
  longDesc: { zh: '詳細作答', en: 'Detailed essay answer' },
  pasteNotesHere: { zh: '在此貼上筆記或學習資料...', en: 'Paste your notes or study material here...' },
  generating: { zh: '正在生成題目...', en: 'Generating questions...' },
  generateBtn: { zh: (t: string) => `生成${t}測驗`, en: (t: string) => `Generate ${t} Quiz` },
  question: { zh: '題目', en: 'Question' },
  of: { zh: '共', en: 'of' },
  correct: { zh: '正確！', en: 'Correct!' },
  incorrect: { zh: '答錯了。', en: 'Incorrect.' },
  writeShort: { zh: '用 1-3 句話作答...', en: 'Write your answer in 1–3 sentences...' },
  writeLong: { zh: '詳細作答...', en: 'Write a detailed answer...' },
  grading: { zh: '正在批改...', en: 'Grading...' },
  submitAnswer: { zh: '提交答案', en: 'Submit Answer' },
  modelAnswer: { zh: '參考答案', en: 'Model Answer' },
  back: { zh: '← 返回', en: '← Back' },
  next: { zh: '下一題 →', en: 'Next →' },
  finish: { zh: '完成', en: 'Finish' },
  excellent: { zh: '非常好！', en: 'Excellent!' },
  goodEffort: { zh: '繼續努力！', en: 'Good effort!' },
  keepStudying: { zh: '繼續溫習！', en: 'Keep studying!' },
  avgScore: { zh: (s: number) => `平均分：${s}/10`, en: (s: number) => `Average score: ${s}/10` },
  gotCorrect: { zh: (s: number, t: number) => `答對 ${s}/${t} 題（${Math.round(s/t*100)}%）`, en: (s: number, t: number) => `You got ${s} out of ${t} correct (${Math.round(s/t*100)}%)` },
  tryAgain: { zh: '重新嘗試', en: 'Try Again' },
  newQuiz: { zh: '新測驗', en: 'New Quiz' },
  generateQuiz: { zh: '生成測驗', en: 'Generate Quiz' },
  questionOf: { zh: '/', en: 'of' },
  youGot: { zh: '你答對了', en: 'You got' },
  outOf: { zh: '題中的', en: 'out of' },
  correct2: { zh: '題正確', en: 'correct' },
  averageScore: { zh: '平均分：', en: 'Average score:' },

  // Flashcards
  tapReveal: { zh: '點擊卡片查看解釋', en: 'Tap card to reveal' },
  tapFlipBack: { zh: '點擊返回正面', en: 'Tap to flip back' },
  stillLearning: { zh: '繼續學習', en: 'Still learning' },
  gotIt: { zh: '記住了！✓', en: 'Got it! ✓' },
  roundComplete: { zh: '完成一輪！', en: 'Round Complete!' },
  known: { zh: '已記住', en: 'known' },
  toReview: { zh: '待複習', en: 'to review' },
  reviewAgain: { zh: (n: number) => `再複習 ${n} 張`, en: (n: number) => `Review ${n} again` },
  shuffleAll: { zh: '重新洗牌', en: 'Shuffle all cards' },
  done: { zh: '完成', en: 'Done' },

  // Review
  wrongAnswersTitle: { zh: '錯題本', en: 'Wrong Answers' },
  clearAll: { zh: '清除全部', en: 'Clear all' },
  noWrongAnswers: { zh: '暫無錯題！', en: 'No wrong answers yet!' },
  noWrongDesc: { zh: '完成測驗後，錯題會自動儲存在這裡。', en: 'Complete a quiz and wrong answers will appear here.' },
  startQuiz: { zh: '開始測驗', en: 'Start a Quiz' },
  yourAnswer: { zh: '你的答案', en: 'Your answer' },
  removeFromReview: { zh: '從錯題本移除', en: 'Remove from review' },
  clearAllConfirm: { zh: '確定清除所有錯題？', en: 'Clear all wrong answers?' },
  less: { zh: '收起', en: 'Less' },
  more: { zh: '展開', en: 'More' },

  // History
  historyTitle: { zh: '分析記錄', en: 'Analysis History' },
  recordsSaved: { zh: (n: number) => `${n} 條記錄`, en: (n: number) => `${n} records saved` },
  searchPlaceholder: { zh: '搜尋標題、摘要、重點...', en: 'Search titles, summaries, key points...' },
  searchResults: { zh: (n: number, q: string) => `"${q}" 找到 ${n} 個結果`, en: (n: number, q: string) => `${n} result${n!==1?'s':''} for "${q}"` },
  noHistory: { zh: '暫無記錄', en: 'No history yet' },
  noHistoryDesc: { zh: '分析過的文件會顯示在這裡。', en: 'Analyzed documents will appear here.' },
  analyzeDoc2: { zh: '分析文件', en: 'Analyze a Document' },
  noSearchResults: { zh: (q: string) => `找不到「${q}」的結果`, en: (q: string) => `No results found for "${q}"` },
  foundInText: { zh: '在原文中找到', en: 'Found in document text' },
  open: { zh: '打開', en: 'Open' },
  deleteRecord: { zh: '刪除記錄', en: 'Delete record' },
  newBtn: { zh: '+ 新增', en: '+ New' },

  // Review — weakness analysis
  analyzeWeakTopics: { zh: 'AI 分析弱項', en: 'Analyze Weak Topics' },
  analyzingTopics: { zh: '正在分析...', en: 'Analyzing...' },
  weakTopicsTitle: { zh: '弱項分析', en: 'Weak Topic Analysis' },

  // Quiz — save as flashcards
  saveWrongAsFlashcards: { zh: '將錯題儲存為閃卡', en: 'Save wrong answers as flashcards' },
  openFlashcards: { zh: '打開閃卡', en: 'Open Flashcards' },

  // Settings
  settingsTitle: { zh: '設定', en: 'Settings' },
  settingsDesc: { zh: '選擇使用 AI 功能的方式。', en: 'Choose how you want to access the AI features.' },
  usingOwnKey: { zh: '使用自己的 API Key', en: 'Using your own API key' },
  usingAccessCode: { zh: '使用訪問碼', en: 'Using access code' },
  remove: { zh: '移除', en: 'Remove' },
  ownApiKey: { zh: '使用自己的 API Key', en: 'My Own API Key' },
  accessCode: { zh: '訪問碼', en: 'Access Code' },
  apiKeyDesc: { zh: '輸入你的 Anthropic API Key。在 console.anthropic.com 申請。', en: 'Enter your own Anthropic API key. Get one at console.anthropic.com' },
  apiKeyNote: { zh: 'Key 儲存在瀏覽器本地，不會上傳至伺服器。', en: 'Your key is stored locally in your browser and never sent to our servers.' },
  accessCodeDesc: { zh: '輸入應用程式擁有者提供的訪問碼以使用其 API。', en: 'Enter the access code provided by the app owner to use their API.' },
  accessCodeNote: { zh: '請聯絡應用程式擁有者索取訪問碼。', en: 'Contact the app owner to request an access code.' },
  saving: { zh: '已儲存！正在跳轉...', en: 'Saved! Redirecting...' },
  saveContinue: { zh: '儲存並繼續', en: 'Save & Continue' },
} as const;

export function useLang() {
  const [lang, setLangState] = useState<Lang>('zh');

  useEffect(() => {
    const stored = localStorage.getItem('app-lang') as Lang | null;
    if (stored === 'en' || stored === 'zh') setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('app-lang', l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  }, [lang, setLang]);

  function t<K extends keyof typeof strings>(key: K): typeof strings[K][Lang] {
    return strings[key][lang] as typeof strings[K][Lang];
  }

  return { lang, setLang, toggle, t };
}

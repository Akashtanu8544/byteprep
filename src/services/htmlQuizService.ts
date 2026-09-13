import { Question } from '../types';

export const HtmlQuizService = {
  generateHtmlQuiz(
    questions: Question[],
    subject: string,
    timerDuration: number,
    playStoreUrl: string = 'https://play.google.com/store/apps/details?id=com.byteprep'
  ): string {
    const questionsJson = JSON.stringify(questions);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} Mock Test | Interactive Quiz</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #020617;
      color: #f8fafc;
    }
    .glowing-button {
      position: relative;
      overflow: hidden;
    }
    .glowing-button::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(244, 63, 94, 0.3),
        transparent
      );
      transform: rotate(45deg);
      transition: 0.5s;
    }
    .glowing-button:hover::after {
      left: 120%;
    }
    /* Simple Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0f172a;
    }
    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 9999px;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-rose-500 selection:text-white">

  <!-- Header -->
  <header class="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
    <div class="max-w-md mx-auto flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
          <i data-lucide="sparkles" class="w-4.5 h-4.5 text-white"></i>
        </div>
        <div>
          <span class="font-extrabold text-sm tracking-tight text-white block">
            BytePrep Mock Test
          </span>
          <span class="text-[9px] font-bold text-rose-400 tracking-wider uppercase block">
            ${subject} Quiz
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-extrabold text-slate-300 flex items-center gap-1">
          <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400"></i>
          <span id="score-counter">Score: 0</span>
        </span>
      </div>
    </div>
  </header>

  <!-- Main Frame Container (Perfect Web & Mobile View Mock Interface) -->
  <main class="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center">
    
    <!-- MOCK PHONE/CONTAINER CARD -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-rose-500/5 relative overflow-hidden flex flex-col space-y-4">
      
      <!-- LOBBY SCREEN -->
      <div id="screen-lobby" class="space-y-5 py-4">
        <div class="text-center space-y-2">
          <div class="inline-flex p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl mb-1">
            <i data-lucide="book-open" class="w-8 h-8"></i>
          </div>
          <h2 class="text-xl font-black tracking-tight text-white">Interactive Mock Test</h2>
          <p class="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Test your concept mastery on <span class="text-sky-400 font-bold">${subject}</span> with real computer science questions!
          </p>
        </div>

        <!-- Meta Details Box -->
        <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 text-xs">
          <div class="flex justify-between border-b border-slate-800/60 pb-2">
            <span class="text-slate-400">Total Questions</span>
            <span id="lobby-total-questions" class="text-white font-bold">0</span>
          </div>
          <div class="flex justify-between border-b border-slate-800/60 pb-2">
            <span class="text-slate-400">Timer per Question</span>
            <span class="text-amber-400 font-extrabold">${timerDuration} seconds</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Target Level</span>
            <span class="text-emerald-400 font-bold">PGT / TGT Exam Ready</span>
          </div>
        </div>

        <!-- Last Scoreboard History Panel -->
        <div id="history-panel" class="hidden space-y-2.5">
          <h4 class="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <i data-lucide="history" class="w-3.5 h-3.5"></i>
            Your Last Mock Scores
          </h4>
          <div id="history-list" class="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
            <!-- Dynamically populated from localStorage -->
          </div>
        </div>

        <button
          onclick="startQuiz()"
          class="w-full glowing-button flex items-center justify-center gap-2 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
        >
          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
          <span>Start Challenge Mock</span>
        </button>
      </div>

      <!-- QUIZ GAME SCREEN -->
      <div id="screen-quiz" class="hidden space-y-4">
        
        <!-- Timer & Progress Bar -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-slate-400" id="quiz-progress-text">Question 1 of 5</span>
            <span class="text-rose-400 flex items-center gap-1.5 font-mono" id="quiz-timer-text">
              <i data-lucide="timer" class="w-3.5 h-3.5 text-rose-500 animate-pulse"></i>
              ${timerDuration}s
            </span>
          </div>
          <div class="h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div id="progress-fill" class="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300" style="width: 20%;"></div>
          </div>
        </div>

        <!-- Question Title -->
        <div class="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 sm:p-5">
          <p id="quiz-question" class="text-sm sm:text-base font-extrabold text-white leading-relaxed">
            What is the time complexity of binary search?
          </p>
        </div>

        <!-- Options Container -->
        <div id="quiz-options" class="space-y-2.5">
          <!-- Options will be generated here -->
        </div>

        <!-- Explanation Card (Initially Hidden) -->
        <div id="quiz-explanation-card" class="hidden bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-1.5 animate-fadeIn">
          <div class="flex items-center gap-1 text-amber-400 font-extrabold">
            <i data-lucide="lightbulb" class="w-4 h-4 text-amber-400"></i>
            <span>EXPLANATION</span>
          </div>
          <p id="quiz-explanation" class="text-slate-300 leading-relaxed font-medium">
            Binary Search divides the interval in half on each step, hence logarithmic time complexity.
          </p>
        </div>

        <!-- Next Button -->
        <button
          id="quiz-next-btn"
          onclick="nextQuestion()"
          class="hidden w-full flex items-center justify-center gap-1.5 py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-sky-500/10"
        >
          <span>Continue</span>
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- RESULTS & PLAYSTORE REDIRECT SCREEN -->
      <div id="screen-result" class="hidden text-center space-y-5 py-4">
        <div class="space-y-2">
          <div class="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl">
            <i data-lucide="trophy" class="w-10 h-10 text-emerald-400"></i>
          </div>
          <h2 class="text-xl font-black tracking-tight text-white">Mock Completed!</h2>
          <p class="text-xs text-slate-400">Your final score card has been recorded</p>
        </div>

        <!-- Score stats panel -->
        <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 divide-x divide-slate-800/80">
          <div>
            <p class="text-[10px] font-black tracking-wider text-slate-500 uppercase">Correct</p>
            <p class="text-lg font-black text-emerald-400" id="result-correct">0</p>
          </div>
          <div>
            <p class="text-[10px] font-black tracking-wider text-slate-500 uppercase">Accuracy</p>
            <p class="text-lg font-black text-rose-400" id="result-accuracy">0%</p>
          </div>
        </div>

        <!-- Dynamic message -->
        <p class="text-xs text-slate-300 font-bold max-w-xs mx-auto">
          Want 5,000+ more Computer Science PYQs & customized Mock Tests?
        </p>

        <!-- Redirect Banner -->
        <div class="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-2 text-center relative overflow-hidden">
          <div class="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-extrabold">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
            <span>PLAY STORE REDIRECTING</span>
          </div>
          <p class="text-[11px] text-slate-400 font-semibold">
            Connecting you to high-yield DSSSB, KVS, PGT mock test bank in <span id="redirect-timer" class="text-white font-black text-sm">5</span> seconds...
          </p>
          <div class="h-1 bg-rose-950/40 rounded-full overflow-hidden">
            <div id="redirect-progress" class="h-full bg-rose-500 transition-all duration-1000" style="width: 100%;"></div>
          </div>
        </div>

        <!-- Explicit direct button -->
        <a
          href="${playStoreUrl}"
          target="_blank"
          class="block w-full py-3 bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-sm rounded-2xl transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
        >
          <i data-lucide="smartphone" class="w-4 h-4"></i>
          <span>Download App / Play Store Now</span>
        </a>
      </div>

    </div>
  </main>

  <!-- Footer Info -->
  <footer class="max-w-md mx-auto w-full px-4 py-4 text-center text-[10px] text-slate-500">
    <p>Powered by BytePrep Daily MCQ Shorts Engine</p>
    <p class="mt-0.5">&copy; 2026 BytePrep Inc. All rights reserved.</p>
  </footer>

  <script>
    // Embed original questions array
    const questions = ${questionsJson};
    const maxTimer = ${timerDuration};
    const playStoreUrl = "${playStoreUrl}";

    let currentIdx = 0;
    let correctCount = 0;
    let score = 0;
    let timerInterval = null;
    let timeLeft = maxTimer;
    let hasAnswered = false;

    // Load Last Scores history from localStorage
    function loadScoreHistory() {
      const historyList = document.getElementById('history-list');
      const historyPanel = document.getElementById('history-panel');
      const history = JSON.parse(localStorage.getItem('bp_score_history') || '[]');

      if (history.length > 0) {
        historyPanel.classList.remove('hidden');
        historyList.innerHTML = history.map((h, i) => \`
          <div class="flex items-center justify-between text-[11px] bg-slate-950 px-3 py-1.5 border border-slate-800/50 rounded-xl">
            <span class="text-slate-400">\${new Date(h.date).toLocaleDateString()}</span>
            <span class="text-emerald-400 font-black">\${h.correct}/\${h.total} Correct (\${h.percent}%)</span>
          </div>
        \`).join('');
      } else {
        historyPanel.classList.add('hidden');
      }
    }

    // Save score to history
    function saveScoreToHistory(correct, total) {
      const history = JSON.parse(localStorage.getItem('bp_score_history') || '[]');
      const percent = Math.round((correct / total) * 100);
      const newScore = {
        date: new Date().toISOString(),
        correct,
        total,
        percent
      };
      // Keep last 4 records
      const updated = [newScore, ...history].slice(0, 4);
      localStorage.setItem('bp_score_history', JSON.stringify(updated));
    }

    // Tick-Tock mechanical clock audio effect using pure Web Audio API
    function playTickSound() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        // alternating tick frequencies
        osc.frequency.setValueAtTime(timeLeft % 2 === 0 ? 2200 : 1800, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } catch (e) {
        // audio context blocked or unready
      }
    }

    function initLobby() {
      document.getElementById('lobby-total-questions').innerText = questions.length;
      loadScoreHistory();
    }

    function startQuiz() {
      document.getElementById('screen-lobby').classList.add('hidden');
      document.getElementById('screen-quiz').classList.remove('hidden');
      currentIdx = 0;
      correctCount = 0;
      score = 0;
      updateScoreBadge();
      loadQuestion(0);
    }

    function updateScoreBadge() {
      document.getElementById('score-counter').innerText = 'Score: ' + score;
    }

    function loadQuestion(idx) {
      hasAnswered = false;
      document.getElementById('quiz-next-btn').classList.add('hidden');
      document.getElementById('quiz-explanation-card').classList.add('hidden');

      const q = questions[idx];
      document.getElementById('quiz-progress-text').innerText = \`Question \${idx + 1} of \${questions.length}\`;
      document.getElementById('progress-fill').style.width = \`\${((idx + 1) / questions.length) * 100}%\`;
      document.getElementById('quiz-question').innerText = q.question;

      // Populate options
      const optionsContainer = document.getElementById('quiz-options');
      optionsContainer.innerHTML = '';
      q.options.forEach((opt, optIdx) => {
        const char = String.fromCharCode(65 + optIdx);
        optionsContainer.innerHTML += \`
          <button
            onclick="selectOption(\${optIdx})"
            id="opt-\${optIdx}"
            class="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800/60 border border-slate-800/80 rounded-2xl flex items-center gap-3 transition-all font-semibold text-xs text-slate-200 outline-none hover:border-slate-700 cursor-pointer"
          >
            <span id="badge-\${optIdx}" class="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-extrabold text-[10px] flex items-center justify-center shrink-0">
              \${char}
            </span>
            <span>\${opt}</span>
          </button>
        \`;
      });

      // Start Question Timer
      timeLeft = maxTimer;
      document.getElementById('quiz-timer-text').innerHTML = \`<i data-lucide="timer" class="w-3.5 h-3.5 text-rose-500 animate-pulse"></i> \${timeLeft}s\`;
      lucide.createIcons();

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timeLeft--;
        playTickSound();
        document.getElementById('quiz-timer-text').innerHTML = \`<i data-lucide="timer" class="w-3.5 h-3.5 text-rose-500 animate-pulse"></i> \${timeLeft}s\`;
        lucide.createIcons();

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          selectOption(-1); // auto select/timeout
        }
      }, 1000);
    }

    function selectOption(selectedIdx) {
      if (hasAnswered) return;
      hasAnswered = true;
      clearInterval(timerInterval);

      const q = questions[currentIdx];
      const correctIdx = q.correctAnswer;

      // Highlight options
      q.options.forEach((_, optIdx) => {
        const btn = document.getElementById('opt-' + optIdx);
        const badge = document.getElementById('badge-' + optIdx);
        
        btn.disabled = true;
        btn.classList.remove('hover:bg-slate-800/60', 'hover:border-slate-700');

        if (optIdx === correctIdx) {
          // Highlight correct answer in green
          btn.classList.add('bg-emerald-950/50', 'border-emerald-500/60', 'text-emerald-300', 'font-black');
          badge.classList.add('bg-emerald-500', 'text-slate-950');
        } else if (optIdx === selectedIdx) {
          // Highlight incorrect selection in red
          btn.classList.add('bg-rose-950/50', 'border-rose-500/60', 'text-rose-300');
          badge.classList.add('bg-rose-500', 'text-slate-950');
        }
      });

      // Score calculation
      if (selectedIdx === correctIdx) {
        correctCount++;
        score += 100 + (timeLeft * 5); // Speed bonus
        updateScoreBadge();
      }

      // Show Explanation
      if (q.explanation) {
        document.getElementById('quiz-explanation').innerText = q.explanation;
        document.getElementById('quiz-explanation-card').classList.remove('hidden');
      }

      // Show Next Button
      document.getElementById('quiz-next-btn').classList.remove('hidden');
    }

    function nextQuestion() {
      currentIdx++;
      if (currentIdx < questions.length) {
        loadQuestion(currentIdx);
      } else {
        showResults();
      }
    }

    function showResults() {
      document.getElementById('screen-quiz').classList.add('hidden');
      document.getElementById('screen-result').classList.remove('hidden');

      // Populate scores
      document.getElementById('result-correct').innerText = \`\${correctCount} / \${questions.length}\`;
      const accuracy = Math.round((correctCount / questions.length) * 100);
      document.getElementById('result-accuracy').innerText = accuracy + '%';

      // Save to localStorage history
      saveScoreToHistory(correctCount, questions.length);

      // Start Auto-redirect timer countdown
      let redirectSecs = 5;
      const redirectBar = document.getElementById('redirect-progress');
      const timerLabel = document.getElementById('redirect-timer');
      
      const countdownInterval = setInterval(() => {
        redirectSecs--;
        timerLabel.innerText = redirectSecs;
        redirectBar.style.width = \`\${(redirectSecs / 5) * 100}%\`;

        if (redirectSecs <= 0) {
          clearInterval(countdownInterval);
          window.location.href = playStoreUrl;
        }
      }, 1000);
    }

    // Initialize Page
    window.onload = () => {
      initLobby();
      lucide.createIcons();
    };
  </script>
</body>
</html>`;
  }
};

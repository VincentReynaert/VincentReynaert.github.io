// exam-qcm/app.js
(async () => {
    "use strict";

    // =========================
    // CONFIG — modifs faciles ici
    // =========================
    const CONFIG = {
        TIME_LIMIT_MINUTES: 20,      // 0 = pas de limite
        SHOW_TIMER: true,            // afficher/masquer le timer (le sticky reste)
        QUESTIONS_TO_ASK: 20,        // 🔥 prend N questions de la banque (si banque >= N)
        SHUFFLE_QUESTIONS: true,
        SHUFFLE_OPTIONS: true,

        // Correction automatique (score stocké dans le JSON, pas affiché)
        ENABLE_CLIENT_SIDE_SCORING: true,

        AUTO_SEND_TO_ONEDRIVE: true, // envoi auto à la fin
        SHOW_ANSWER_COUNT_END: false,
        SHOW_ANSWER_COUNT_DURING: false
    };

    // Regex ID étudiant (modifiable)
    const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}'’\- ]*$/u;

    // Flow Power Automate
    const ONEDRIVE_FLOW_URL = "COLLE_ICI_L_URL_DU_FLOW";

    // =========================
    // HELPERS
    // =========================
    const $ = (sel) => document.querySelector(sel);

    function fatal(msg, err) {
        console.error("[EXAM-QCM]", msg, err || "");
        const sub = $("#subtitle");
        if (sub) sub.textContent = "Erreur technique : impossible de démarrer le questionnaire.";

        const card = $("#stepWelcome");
        if (card) {
            const box = document.createElement("div");
            box.className = "consent";
            box.innerHTML = `
        <b>Erreur :</b> ${msg}<br/>
        <span class="muted">Vérifie <code>questions.js</code> et le chemin du dossier sur GitHub Pages.</span>
      `;
            card.prepend(box);
        }
        const btnStart = $("#btnStart");
        if (btnStart) {
            btnStart.disabled = true;
            btnStart.textContent = "Indisponible";
        }
    }
    function nowIso() { return new Date().toISOString(); }
    function newSessionId() {
        return (crypto?.randomUUID?.() ?? ("sess_" + Date.now() + "_" + Math.random().toString(16).slice(2)));
    }

    function getUrlParam(name) {
        const u = new URL(window.location.href);
        const v = u.searchParams.get(name);
        return v ? v.trim() : "";
    }

    function setUrlParam(name, value) {
        const u = new URL(window.location.href);
        if (!value) u.searchParams.delete(name);
        else u.searchParams.set(name, value);
        history.replaceState({}, "", u.toString());
    }


    function shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }


    async function copyToClipboard(text) {
        try { await navigator.clipboard.writeText(text); return true; }
        catch { return false; }
    }

    async function sendToOneDrive(obj) {
        if (!ONEDRIVE_FLOW_URL || ONEDRIVE_FLOW_URL.includes("COLLE_ICI")) {
            throw new Error("URL Power Automate non configurée (ONEDRIVE_FLOW_URL).");
        }
        const res = await fetch(ONEDRIVE_FLOW_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify(obj),
            keepalive: true
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${text}`);
        }
    }

    function showStep(step) {
        $("#stepWelcome").hidden = (step !== "welcome");
        $("#stepQuiz").hidden = (step !== "quiz");
        $("#stepResults").hidden = (step !== "results");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // =========================
    // LOAD QUESTIONS
    // =========================
    let QUIZ;
    try {
        ({ QUIZ } = await import("./questions.js"));
    } catch (e) {
        fatal("Impossible de charger questions.js (fichier manquant ou erreur).", e);
        return;
    }
    if (!QUIZ || !Array.isArray(QUIZ.questions) || QUIZ.questions.length === 0) {
        fatal("questions.js chargé mais QUIZ.questions est vide/invalide.", null);
        return;
    }

    // =========================
    // DOM
    // =========================
    const givenNameEl = document.querySelector("#givenName"); // Prénom
    const familyNameEl = document.querySelector("#familyName");    // Nom
    const givenNameMsg = document.querySelector("#givenNameMsg");
    const familyNameMsg = document.querySelector("#familyNameMsg");

    const consentBox = $("#consentBox");
    const btnStart = $("#btnStart");

    const durationHint = document.querySelector("#durationHint");

    const timerPill = $("#timerPill");
    const answeredPill = $("#answeredPill");
    const questionList = $("#questionList");
    const btnSubmit = $("#btnSubmit");

    const thankYouText = $("#thankYouText");
    const saveStatus = $("#saveStatus");
    const fallbackActions = $("#fallbackActions");
    const btnDownloadJson = $("#btnDownloadJson");
    const btnCopyJson = $("#btnCopyJson");
    const debugPanel = $("#debugPanel");
    const jsonPreview = $("#jsonPreview");

    const DEBUG = getUrlParam("debug") === "1";

    // =========================
    // STATE
    // =========================
    const state = {
        session_id: newSessionId(),
        started_at_utc: nowIso(),
        participant_id: "",
        task_id: "",
        phase: "",
        consent: false,

        presented: null, // { questions: [...] }
        responses: {},   // question_id -> selected presented indices []

        deadline_ms: null,
        timerHandle: null,
        finished: false,
        timed_out: false,

        results: null
    };

    // =========================
    // VALIDATION
    // =========================
    function formatDurationHint(totalMinutes) {
        const totalSeconds = Math.max(0, Math.floor(totalMinutes * 60));

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (days > 0) {
            return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min`;
        }

        if (hours > 0) {
            return `${hours}h${String(minutes).padStart(2, "0")}`;
        }

        return `${minutes} min`;
    }

    // Prénom: Jean / Jean-Paul / Jean Pierre -> "Jean-Paul" / "Jean Pierre"
    function normalizeFirstName(s) {
        return (s || "")
            .trim()
            .replace(/\s+/g, " ")
            .split(" ")
            .map(part =>
                part.split("-").map(p => p ? (p[0].toUpperCase() + p.slice(1).toLowerCase()) : "").join("-")
            )
            .join(" ");
    }

    // Nom: "dupont" -> "DUPONT" (souvent préférable pour éviter ambiguïtés)
    function normalizeLastName(s) {
        return (s || "").trim().replace(/\s+/g, " ").toUpperCase();
    }

    function normalizeHumanName(value) {
        return (value || "")
            .normalize("NFC")       // normalisation Unicode
            .replace(/\s+/g, " ")   // espaces multiples → un seul
            .trim();
    }

    function validateHumanName(inputEl, messageEl) {
        const raw = inputEl.value.normalize("NFC");

        // Version "souple" pour la saisie :
        // - on n'efface pas ce que l'utilisateur tape
        // - on autorise les espaces internes pendant qu'il écrit
        const trimmed = raw.trim();
        const hasLetter = /\p{L}/u.test(trimmed);
        const validChars = trimmed === "" || NAME_REGEX.test(trimmed);

        const valid = trimmed.length > 0 && hasLetter && validChars;

        inputEl.classList.toggle("invalid", trimmed !== "" && !valid);
        inputEl.classList.toggle("valid", valid);

        if (messageEl) {
            if (trimmed.length === 0) {
                messageEl.textContent = "Champ obligatoire";
            } else if (!validChars) {
                messageEl.textContent = "Caractères non valides";
            } else {
                messageEl.textContent = "OK";
            }
        }

        return valid;
    }

    function validateNames() {

        const firstOk = validateHumanName(givenNameEl, givenNameMsg);
        const lastOk = validateHumanName(familyNameEl, familyNameMsg);

        return firstOk && lastOk;
    }

    function refreshStartState() {
        const okNames = validateNames();
        btnStart.disabled = !(consentBox.checked && okNames);
    }

    givenNameEl.addEventListener("blur", () => {
        givenNameEl.value = normalizeFirstName(givenNameEl.value);
        refreshStartState();
    });

    familyNameEl.addEventListener("blur", () => {
        familyNameEl.value = normalizeLastName(familyNameEl.value);
        refreshStartState();
    });

    givenNameEl.addEventListener("input", refreshStartState);
    familyNameEl.addEventListener("input", refreshStartState);
    consentBox.addEventListener("change", refreshStartState);

    consentBox.addEventListener("change", refreshStartState);

    // =========================
    // PREFILL (task/phase) FROM URL
    // =========================
    function initFromUrl() {
        const t = getUrlParam("task");
        if (t) { taskId.value = t; taskId.readOnly = true; }

        const p = normalizePhase(getUrlParam("phase"));
        if (p) { phase.value = p; phase.disabled = true; }
    }

    // =========================
    // BUILD PRESENTED QUIZ (sample + shuffle)
    // =========================
    function normalizeOption(opt) {
        if (typeof opt === "string") return { text: opt, image: null, alt: "" };
        if (opt && typeof opt === "object") {
            return {
                text: opt.text ?? "",
                image: opt.image ?? null,
                alt: opt.alt ?? opt.image_alt ?? ""
            };
        }
        return { text: String(opt ?? ""), image: null, alt: "" };
    }

    function buildPresentedQuiz() {
        const pool = QUIZ.questions.map((q, qIndex) => ({
            id: q.id ?? `q${qIndex + 1}`,
            text: q.text ?? "",
            image: q.image ?? null,
            image_alt: q.image_alt ?? q.imageAlt ?? "",
            multi: (q.multi !== undefined) ? !!q.multi : (Array.isArray(q.correct) && q.correct.length > 1),
            points: (typeof q.points === "number" && isFinite(q.points)) ? q.points : 1,
            correct: Array.isArray(q.correct) ? q.correct.slice() : null,
            options: (q.options ?? []).map((opt, oi) => ({
                orig_index: oi,
                ...normalizeOption(opt)
            }))
        }));

        // Shuffle questions then take N
        if (CONFIG.SHUFFLE_QUESTIONS) shuffleInPlace(pool);

        const n = Math.max(1, Math.min(CONFIG.QUESTIONS_TO_ASK || pool.length, pool.length));
        const picked = pool.slice(0, n);

        // Shuffle options per question
        for (const q of picked) {
            if (CONFIG.SHUFFLE_OPTIONS) shuffleInPlace(q.options);
        }

        return { questions: picked, pool_size: pool.length, sample_size: n };
    }

    // =========================
    // RENDER QUESTIONS
    // =========================
    function updateAnsweredPill() {
        if (!CONFIG.SHOW_ANSWER_COUNT_DURING) {
            answeredPill.hidden = true;
            return;
        }
        const total = state.presented.questions.length;
        let answered = 0;
        for (const q of state.presented.questions) {
            const sel = state.responses[q.id] ?? [];
            if (sel.length > 0) answered += 1;
        }
        answeredPill.textContent = `Réponses : ${answered}/${total}`;
        answeredPill.hidden = false;
    }

    function setResponse(qid, selectedPresentedIndices) {
        state.responses[qid] = selectedPresentedIndices.slice().sort((a, b) => a - b);
        updateAnsweredPill();
    }

    function renderAllQuestions() {
        questionList.innerHTML = "";
        const total = state.presented.questions.length;

        state.presented.questions.forEach((q, qi) => {
            const card = document.createElement("div");
            card.className = "qCard";
            card.id = `q_${q.id}`;

            const title = document.createElement("p");
            title.className = "qTitle";
            title.textContent = `${qi + 1}. ${q.text}`;
            card.appendChild(title);

            if (q.image) {
                const img = document.createElement("img");
                img.className = "qImg";
                img.src = q.image;
                img.alt = q.image_alt || "Image de la question";
                img.loading = "lazy";
                card.appendChild(img);
            }

            const meta = document.createElement("p");
            meta.className = "qMeta";
            meta.textContent = q.multi ? "Plusieurs réponses possibles. (Vous pouvez laisser vide.)"
                : "Une seule réponse possible. (Vous pouvez laisser vide.)";
            card.appendChild(meta);

            const groupName = `grp_${q.id}`;

            q.options.forEach((opt, oi) => {
                const label = document.createElement("label");
                label.className = "option";

                const input = document.createElement("input");
                input.type = q.multi ? "checkbox" : "radio";
                input.name = groupName;
                input.value = String(oi);

                input.addEventListener("change", () => {
                    const inputs = card.querySelectorAll(`input[name="${groupName}"]`);
                    const selected = [];
                    inputs.forEach((el) => { if (el.checked) selected.push(Number(el.value)); });
                    setResponse(q.id, selected);
                });

                const body = document.createElement("div");
                body.className = "optionBody";

                if (opt.text) {
                    const p = document.createElement("p");
                    p.className = "optionText";
                    p.textContent = opt.text;
                    body.appendChild(p);
                }

                if (opt.image) {
                    const img = document.createElement("img");
                    img.className = "optImg";
                    img.src = opt.image;
                    img.alt = opt.alt || "Image de réponse";
                    img.loading = "lazy";
                    body.appendChild(img);
                }

                label.appendChild(input);
                label.appendChild(body);
                card.appendChild(label);
            });

            // Clear
            const qa = document.createElement("div");
            qa.className = "qActions";
            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className = "linkBtn";
            clearBtn.textContent = "Effacer la réponse";
            clearBtn.addEventListener("click", () => {
                const inputs = card.querySelectorAll(`input[name="${groupName}"]`);
                inputs.forEach((el) => (el.checked = false));
                setResponse(q.id, []);
            });
            qa.appendChild(clearBtn);
            card.appendChild(qa);

            questionList.appendChild(card);
        });

        // init answered pill
        if (CONFIG.SHOW_ANSWER_COUNT_DURING) {
            answeredPill.hidden = false;
            answeredPill.textContent = `Réponses : 0/${total}`;
        } else {
            answeredPill.hidden = true;
        }
    }

    // =========================
    // TIMER
    // =========================
    function formatDurationLong(totalSeconds) {
        const maxSeconds = 364 * 24 * 60 * 60 + 23 * 60 * 60 + 59 * 60 + 59;
        const s = Math.max(0, Math.min(Math.floor(totalSeconds), maxSeconds));

        const days = Math.floor(s / 86400);
        const hours = Math.floor((s % 86400) / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const seconds = s % 60;

        if (days > 0) {
            return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
        }

        if (hours > 0) {
            return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
        }

        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    function stopTimer() {
        if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
    }

    function startTimer() {
        if (!CONFIG.TIME_LIMIT_MINUTES || CONFIG.TIME_LIMIT_MINUTES <= 0) {
            timerPill.hidden = true;
            return;
        }

        timerPill.hidden = !CONFIG.SHOW_TIMER;
        state.deadline_ms = Date.now() + CONFIG.TIME_LIMIT_MINUTES * 60 * 1000;

        const tick = () => {
            const remaining = state.deadline_ms - Date.now();
            if (CONFIG.SHOW_TIMER) timerPill.textContent = `Temps restant : ${formatDurationLong(remaining / 1000)}`;
            if (remaining <= 0) { stopTimer(); finish(true); }
        };

        tick();
        state.timerHandle = setInterval(tick, 250);
    }

    // =========================
    // SCORING RULE: subset ratio OR 0
    // =========================
    function scoreQuestionSubsetRatio(q, selectedOriginalIndices) {
        // si pas de correction côté client -> null
        if (!CONFIG.ENABLE_CLIENT_SIDE_SCORING) return null;
        if (!Array.isArray(q.correct) || q.correct.length === 0) return null;

        const correct = new Set(q.correct);
        if (!selectedOriginalIndices || selectedOriginalIndices.length === 0) return 0;

        // si une mauvaise réponse est cochée => 0
        for (const idx of selectedOriginalIndices) {
            if (!correct.has(idx)) return 0;
        }

        // sinon ratio (#bonnes cochées)/(#bonnes)
        return selectedOriginalIndices.length / correct.size;
    }

    // =========================
    // FINISH & SAVE
    // =========================
    function disableQuizInputs() {
        const inputs = $("#stepQuiz").querySelectorAll("input, button");
        inputs.forEach(el => { if (el.id !== "btnSubmit") el.disabled = true; });
        btnSubmit.disabled = true;
    }

    function computeResults() {
        const presentedQuestions = state.presented.questions;

        const answers = presentedQuestions.map((q, qi) => {
            const selectedPresented = (state.responses[q.id] ?? []).slice().sort((a, b) => a - b);

            const selectedOriginal = selectedPresented
                .map(i => q.options[i]?.orig_index)
                .filter((x) => typeof x === "number")
                .sort((a, b) => a - b);

            const ratio01 = scoreQuestionSubsetRatio(q, selectedOriginal);
            const points = q.points ?? 1;
            const score_points = (ratio01 === null) ? null : Number((ratio01 * points).toFixed(4));

            return {
                question_id: q.id,
                question_presented_index: qi,
                points,
                // mapping utile pour recalculer / audit
                options_presented: q.options.map(o => ({ orig_index: o.orig_index, text: o.text ?? "", image: o.image ?? null })),
                selected_presented_indices: selectedPresented,
                selected_original_indices: selectedOriginal,
                score_ratio_0_1: ratio01,
                score_points
            };
        });

        const n_questions = presentedQuestions.length;
        const n_answered = answers.filter(a => (a.selected_presented_indices?.length ?? 0) > 0).length;
        const first_name = normalizeFirstName(givenNameEl.value);
        const last_name = normalizeLastName(familyNameEl.value);
        // total score (si scoring activé)
        let score_total = null, score_max = null, score_percent = null;
        if (CONFIG.ENABLE_CLIENT_SIDE_SCORING) {
            score_total = 0;
            score_max = 0;
            for (const a of answers) {
                score_max += (a.points ?? 1);
                score_total += (a.score_points ?? 0);
            }
            score_total = Number(score_total.toFixed(4));
            score_max = Number(score_max.toFixed(4));
            score_percent = score_max > 0 ? Number(((score_total / score_max) * 100).toFixed(2)) : null;
        }

        const ended = nowIso();
        const duration_seconds = Math.max(0, Math.round((Date.parse(ended) - Date.parse(state.started_at_utc)) / 1000));

        return {
            instrument: QUIZ.title,
            version: QUIZ.version,

            session_id: state.session_id,
            started_at_utc: state.started_at_utc,
            ended_at_utc: ended,
            duration_seconds,

            givenName: first_name,
            familyName: last_name,

            config: {
                time_limit_minutes: CONFIG.TIME_LIMIT_MINUTES,
                shuffle_questions: CONFIG.SHUFFLE_QUESTIONS,
                shuffle_options: CONFIG.SHUFFLE_OPTIONS,
                pool_size: state.presented.pool_size,
                sample_size: state.presented.sample_size,
                scoring_rule: "subset_ratio_or_zero",
                client_side_scoring: CONFIG.ENABLE_CLIENT_SIDE_SCORING
            },

            timed_out: state.timed_out,
            n_questions,
            n_answered,

            score_total,
            score_max,
            score_percent,

            answers
        };
    }

    async function finish(timedOut) {
        if (state.finished) return;
        state.finished = true;
        state.timed_out = !!timedOut;
        stopTimer();
        disableQuizInputs();

        state.results = computeResults();

        // fin neutre
        thankYouText.textContent = "Merci pour votre participation. Vous pouvez fermer cette page.";
        saveStatus.textContent = "";

        if (CONFIG.SHOW_ANSWER_COUNT_END) {
            saveStatus.textContent = `Questions répondues : ${state.results.n_answered}/${state.results.n_questions}.`;
        }

        showStep("results");

        // debug si ?debug=1
        if (DEBUG) {
            debugPanel.hidden = false;
            jsonPreview.textContent = JSON.stringify(state.results, null, 2);
        } else {
            debugPanel.hidden = true;
        }

        fallbackActions.hidden = true;

        if (CONFIG.AUTO_SEND_TO_ONEDRIVE) {
            saveStatus.textContent = "Enregistrement en cours…";
            try {
                await sendToOneDrive(state.results);
                saveStatus.textContent = "Enregistrement terminé.";
            } catch (e) {
                console.error(e);
                saveStatus.textContent = "Problème d’enregistrement. Merci de prévenir l’enseignant.";
                fallbackActions.hidden = false;

                if (DEBUG) {
                    debugPanel.hidden = false;
                    jsonPreview.textContent = JSON.stringify(state.results, null, 2);
                }
            }
        }
    }

    // fallback export/copy
    btnDownloadJson.addEventListener("click", () => {
        const json = JSON.stringify(state.results ?? {}, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "exam_qcm_result.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    });

    btnCopyJson.addEventListener("click", async () => {
        const json = JSON.stringify(state.results ?? {}, null, 2);
        await copyToClipboard(json);
        btnCopyJson.textContent = "Copié ✅";
        setTimeout(() => (btnCopyJson.textContent = "Copier le JSON"), 900);
    });

    // =========================
    // START
    // =========================
    btnStart.addEventListener("click", () => {
        refreshStartState();
        if (btnStart.disabled) return;

        state.session_id = newSessionId();
        state.started_at_utc = nowIso();
        state.presented = buildPresentedQuiz();
        state.responses = {};
        state.finished = false;
        state.timed_out = false;

        // init timer label
        if (CONFIG.SHOW_TIMER && CONFIG.TIME_LIMIT_MINUTES > 0) {
            timerPill.textContent = `Temps restant : ${formatDurationLong(CONFIG.TIME_LIMIT_MINUTES * 60)}`;
            timerPill.hidden = false;
        } else {
            timerPill.hidden = true;
        }

        startTimer();
        renderAllQuestions();
        showStep("quiz");
    });

    btnSubmit.addEventListener("click", () => finish(false));

    // =========================
    // BOOT
    // =========================
    $("#title").textContent = QUIZ.title;
    $("#subtitle").textContent = QUIZ.intro ?? "";
    $("#buildTag").textContent = QUIZ.version;

    initFromUrl();
    if (durationHint) {
        durationHint.textContent = formatDurationHint(CONFIG.TIME_LIMIT_MINUTES);
    }
    // timer hidden until quiz starts (mais sticky prêt)
    timerPill.hidden = true;
    answeredPill.hidden = !CONFIG.SHOW_ANSWER_COUNT_DURING;

    refreshStartState();
    showStep("welcome");
})();
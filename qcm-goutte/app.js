import { QUIZ } from "./questions.js";

(() => {
    "use strict";

    // =========================
    // CONFIG (à modifier facilement)
    // =========================
    const CONFIG = {
        TIME_LIMIT_MINUTES: 20,      // 🔧 Durée (mettre 0 pour désactiver la limite)
        SHOW_TIMER: true,            // 🔧 Afficher/masquer le chronomètre (la limite peut rester active)
        SHUFFLE_QUESTIONS: true,     // 🔧 Shuffle questions
        SHUFFLE_OPTIONS: true,       // 🔧 Shuffle réponses (options)

        AUTO_SEND_TO_ONEDRIVE: true, // 🔧 Envoi automatique à la fin
        SHOW_RESTART_BUTTON: false,  // 🔧 Si tu fais passer plusieurs participants sur le même PC

        SHOW_ANSWER_COUNT_END: false,// 🔧 (option) afficher “Vous avez répondu à X/N”
        SHOW_ANSWER_COUNT_DURING: false, // 🔧 (option) afficher pill “Réponses X/N” pendant le QCM
    };

    // 🔧 Regex participant (modifier ICI si besoin)
    const PARTICIPANT_ID_REGEX = /^[A-Z]{3}[a-z]{3}\d+$/;

    // 🔧 URL Power Automate
    const ONEDRIVE_FLOW_URL = "COLLE_ICI_L_URL_DU_FLOW";

    // =========================
    // HELPERS
    // =========================
    const $ = (sel) => document.querySelector(sel);

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

    function normalizePhase(v) {
        const s = (v || "").toLowerCase().trim();
        if (["pre", "pretest", "pre-test", "pre_test", "pré", "pré-test"].includes(s)) return "pre";
        if (["post", "posttest", "post-test", "post_test"].includes(s)) return "post";
        if (["retention", "rétention", "ret", "retention-test", "retention_test"].includes(s)) return "retention";
        return "";
    }

    function shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatMMSS(ms) {
        const total = Math.max(0, Math.ceil(ms / 1000));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
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
    // STATE
    // =========================
    const state = {
        session_id: newSessionId(),
        started_at_utc: nowIso(),
        ended_at_utc: null,

        participant_id: "",
        task_id: "",
        phase: "",
        consent: false,

        // Presented quiz (shuffled)
        presented: null, // { questions: [...] }
        // Responses: map question_id -> array of selected presented option indices
        responses: {},

        deadline_ms: null,
        timerHandle: null,
        finished: false,
        timed_out: false,

        results: null,
        sent_ok: false
    };

    // =========================
    // DOM
    // =========================
    const participantId = $("#participantId");
    const taskId = $("#taskId");
    const phase = $("#phase");
    const consentBox = $("#consentBox");
    const btnStart = $("#btnStart");

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

    const restartRow = $("#restartRow");
    const btnRestart = $("#btnRestart");

    const DEBUG = getUrlParam("debug") === "1";

    // =========================
    // VALIDATION
    // =========================
    function validateParticipantId() {
        const v = participantId.value.trim();
        const ok = PARTICIPANT_ID_REGEX.test(v);

        participantId.classList.toggle("invalid", v !== "" && !ok);
        participantId.classList.toggle("valid", ok);

        participantId.setCustomValidity(
            ok || v === "" ? "" : "Format : 3 MAJ + 3 min + nombre (ex. ABCdef12)"
        );

        const msg = $("#participantIdMsg");
        if (msg) {
            if (v === "") msg.textContent = "Champ obligatoire";
            else if (!ok) msg.textContent = "Format invalide (ex. ABCdef12)";
            else msg.textContent = "Identifiant valide ✔";
        }
        return ok;
    }

    function validatePhase() {
        const v = phase.value.trim();
        const ok = v === "pre" || v === "post" || v === "retention";
        phase.classList.toggle("invalid", v === "");
        phase.classList.toggle("valid", ok);
        phase.setCustomValidity(ok ? "" : "Veuillez sélectionner un type de passation.");
        return ok;
    }

    function refreshStartState() {
        state.participant_id = participantId.value.trim();
        state.task_id = taskId.value.trim();
        state.phase = phase.value.trim();
        state.consent = consentBox.checked;

        const pidOk = validateParticipantId();
        const phaseOk = validatePhase();

        btnStart.disabled = !(state.consent && pidOk && phaseOk);
    }

    // auto-correction casse AAA bbb 123
    participantId.addEventListener("input", () => {
        const start = participantId.selectionStart ?? participantId.value.length;
        const end = participantId.selectionEnd ?? participantId.value.length;

        let v = participantId.value;
        if (v.length >= 3) v = v.slice(0, 3).toUpperCase() + v.slice(3);
        if (v.length >= 6) v = v.slice(0, 3) + v.slice(3, 6).toLowerCase() + v.slice(6);

        participantId.value = v;
        try { participantId.setSelectionRange(start, end); } catch { }
        refreshStartState();
    });

    taskId.addEventListener("input", () => {
        if (!taskId.readOnly) setUrlParam("task", taskId.value.trim());
        refreshStartState();
    });

    phase.addEventListener("change", () => {
        if (!phase.disabled) setUrlParam("phase", phase.value.trim());
        refreshStartState();
    });

    consentBox.addEventListener("change", refreshStartState);

    // =========================
    // INIT FROM URL
    // =========================
    function initFromUrl() {
        const t = getUrlParam("task");
        if (t) {
            taskId.value = t;
            taskId.readOnly = true;
            taskId.title = "Pré-rempli par l’URL, non modifiable";
        }

        const p = normalizePhase(getUrlParam("phase"));
        if (p) {
            phase.value = p;
            phase.disabled = true;
            phase.title = "Pré-rempli par l’URL, non modifiable";
        }

        // Si l’URL ne contient pas phase/task, elles seront ajoutées si l’utilisateur les saisit.
    }

    // =========================
    // BUILD PRESENTED QUIZ (shuffle)
    // =========================
    function buildPresentedQuiz() {
        const src = QUIZ.questions.map(q => ({
            id: q.id,
            text: q.text,
            multi: !!q.multi,
            options: q.options.map((txt, idx) => ({ orig_index: idx, text: txt }))
        }));

        if (CONFIG.SHUFFLE_QUESTIONS) shuffleInPlace(src);

        for (const q of src) {
            if (CONFIG.SHUFFLE_OPTIONS) shuffleInPlace(q.options);
        }

        return { questions: src };
    }

    // =========================
    // RENDER ALL QUESTIONS
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
                    inputs.forEach((el) => {
                        if (el.checked) selected.push(Number(el.value));
                    });
                    setResponse(q.id, selected);
                });

                const p = document.createElement("p");
                p.className = "optionText";
                p.textContent = opt.text;

                label.appendChild(input);
                label.appendChild(p);
                card.appendChild(label);
            });

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

        updateAnsweredPill();
    }

    // =========================
    // TIMER
    // =========================
    function stopTimer() {
        if (state.timerHandle) {
            clearInterval(state.timerHandle);
            state.timerHandle = null;
        }
    }

    function startTimer() {
        if (!CONFIG.TIME_LIMIT_MINUTES || CONFIG.TIME_LIMIT_MINUTES <= 0) {
            timerPill.hidden = true;
            return;
        }

        if (!CONFIG.SHOW_TIMER) timerPill.hidden = true;
        else timerPill.hidden = false;

        state.deadline_ms = Date.now() + CONFIG.TIME_LIMIT_MINUTES * 60 * 1000;

        const tick = () => {
            const remaining = state.deadline_ms - Date.now();

            if (CONFIG.SHOW_TIMER) {
                timerPill.textContent = `Temps restant : ${formatMMSS(remaining)}`;
            }

            if (remaining <= 0) {
                stopTimer();
                finish(true);
            }
        };

        tick();
        state.timerHandle = setInterval(tick, 250);
    }

    // =========================
    // RESULTS (no score shown)
    // =========================
    function computeResults() {
        const presentedQuestions = state.presented.questions;

        const answers = presentedQuestions.map((q, qi) => {
            const selectedPresented = (state.responses[q.id] ?? []).slice().sort((a, b) => a - b);

            const selectedOriginal = selectedPresented
                .map(i => q.options[i]?.orig_index)
                .filter((x) => typeof x === "number")
                .sort((a, b) => a - b);

            return {
                question_id: q.id,
                question_presented_index: qi,
                options_presented: q.options.map(o => ({ orig_index: o.orig_index, text: o.text })),
                selected_presented_indices: selectedPresented,
                selected_original_indices: selectedOriginal
            };
        });

        const n_questions = presentedQuestions.length;
        const n_answered = answers.filter(a => (a.selected_presented_indices?.length ?? 0) > 0).length;

        const ended = nowIso();
        const duration_seconds = Math.max(
            0,
            Math.round((Date.parse(ended) - Date.parse(state.started_at_utc)) / 1000)
        );

        return {
            instrument: QUIZ.title,
            version: QUIZ.version,

            session_id: state.session_id,
            started_at_utc: state.started_at_utc,
            ended_at_utc: ended,
            duration_seconds,

            participant_id: state.participant_id,
            task_id: state.task_id || null,
            phase: state.phase,

            time_limit_minutes: CONFIG.TIME_LIMIT_MINUTES,
            timed_out: state.timed_out,

            n_questions,
            n_answered,

            answers
        };
    }

    function disableQuizInputs() {
        const inputs = $("#stepQuiz").querySelectorAll("input, button");
        inputs.forEach(el => {
            if (el.id === "btnSubmit") return;
            el.disabled = true;
        });
        btnSubmit.disabled = true;
    }

    async function finish(timedOut) {
        if (state.finished) return;
        state.finished = true;
        state.timed_out = !!timedOut;
        stopTimer();
        disableQuizInputs();

        state.results = computeResults();

        // Page de fin : pas de score, pas de feedback de performance
        if (CONFIG.SHOW_ANSWER_COUNT_END) {
            thankYouText.textContent = `Merci pour votre participation.`;
            saveStatus.textContent = `Questions répondues : ${state.results.n_answered}/${state.results.n_questions}.`;
        } else {
            thankYouText.textContent = `Merci pour votre participation. Vous pouvez fermer cette page.`;
            saveStatus.textContent = "";
        }

        showStep("results");

        // Debug panel (seulement si ?debug=1)
        if (DEBUG) {
            debugPanel.hidden = false;
            jsonPreview.textContent = JSON.stringify(state.results, null, 2);
            restartRow.hidden = !CONFIG.SHOW_RESTART_BUTTON;
        } else {
            debugPanel.hidden = true;
            restartRow.hidden = !CONFIG.SHOW_RESTART_BUTTON;
        }

        // Fallback actions: seulement si debug ou erreur d'envoi
        fallbackActions.hidden = true;

        // Auto send OneDrive
        if (CONFIG.AUTO_SEND_TO_ONEDRIVE) {
            saveStatus.textContent = "Enregistrement en cours…";
            try {
                await sendToOneDrive(state.results);
                state.sent_ok = true;
                saveStatus.textContent = "Enregistrement terminé.";
            } catch (e) {
                state.sent_ok = false;
                saveStatus.textContent = "Problème d’enregistrement. Merci de prévenir l’animateur.";
                fallbackActions.hidden = false;

                // aussi afficher debug JSON si souhaité
                if (DEBUG) {
                    debugPanel.hidden = false;
                    jsonPreview.textContent = JSON.stringify(state.results, null, 2);
                }
            }
        }

        // Restart (si activé)
        if (CONFIG.SHOW_RESTART_BUTTON) {
            restartRow.hidden = false;
            btnRestart.disabled = !state.sent_ok; // seulement si sauvegarde OK
        }
    }

    // Fallback export
    btnDownloadJson.addEventListener("click", () => {
        const json = JSON.stringify(state.results ?? {}, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "qcm_goutte_result.json";
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

    // Restart
    btnRestart.addEventListener("click", () => {
        if (!CONFIG.SHOW_RESTART_BUTTON) return;
        if (!state.sent_ok) return;

        // reset minimal
        state.session_id = newSessionId();
        state.started_at_utc = nowIso();
        state.ended_at_utc = null;
        state.responses = {};
        state.presented = null;
        state.deadline_ms = null;
        state.timerHandle = null;
        state.finished = false;
        state.timed_out = false;
        state.results = null;
        state.sent_ok = false;

        participantId.value = "";
        participantId.classList.remove("valid", "invalid");
        $("#participantIdMsg").textContent = "Champ obligatoire";
        consentBox.checked = false;

        // task / phase restent (souvent fixé par l’URL)
        refreshStartState();
        showStep("welcome");
    });

    // Start
    btnStart.addEventListener("click", () => {
        refreshStartState();
        if (btnStart.disabled) return;

        state.session_id = newSessionId();
        state.started_at_utc = nowIso();
        state.presented = buildPresentedQuiz();
        state.responses = {};
        state.finished = false;
        state.timed_out = false;

        // Timer
        startTimer();

        // Render
        renderAllQuestions();
        showStep("quiz");
    });

    // Submit button (pas besoin d’avoir répondu à tout)
    btnSubmit.addEventListener("click", () => finish(false));

    // =========================
    // BOOT
    // =========================
    $("#title").textContent = QUIZ.title;
    $("#subtitle").textContent = QUIZ.intro ?? "";
    $("#buildTag").textContent = QUIZ.version;

    initFromUrl();

    // timer initial display
    if (CONFIG.SHOW_TIMER && CONFIG.TIME_LIMIT_MINUTES > 0) {
        timerPill.textContent = `Temps restant : ${String(CONFIG.TIME_LIMIT_MINUTES).padStart(2, "0")}:00`;
        timerPill.hidden = true; // visible seulement en quiz
    } else {
        timerPill.hidden = true;
    }

    // answered pill initial
    answeredPill.hidden = !CONFIG.SHOW_ANSWER_COUNT_DURING;

    // restart row
    restartRow.hidden = !CONFIG.SHOW_RESTART_BUTTON;

    refreshStartState();
    showStep("welcome");
})();
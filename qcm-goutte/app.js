import { QUIZ } from "./questions.js";

(() => {
    "use strict";

    // =========================
    // CONFIG
    // =========================

    // 🔧 Règle participant ID : modifie ICI la regex si tu changes le format
    // Exigé : 3 lettres MAJ + 3 lettres min + un nombre
    const PARTICIPANT_ID_REGEX = /^[A-Z]{3}[a-z]{3}\d+$/;

    // 🔧 Colle ici l’URL de ton Flow Power Automate (When an HTTP request is received)
    const ONEDRIVE_FLOW_URL = "COLLE_ICI_L_URL_DU_FLOW";

    // =========================
    // HELPERS
    // =========================

    const $ = (sel) => document.querySelector(sel);

    function nowIso() {
        return new Date().toISOString();
    }

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

    function shareableUrl() {
        // Lien à diffuser : inclut phase + task, pas l’ID participant
        const u = new URL(window.location.href);
        u.searchParams.delete("pid");
        return u.toString();
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); } catch { }
            ta.remove();
            return true;
        }
    }

    async function sendToOneDrive(obj) {
        if (!ONEDRIVE_FLOW_URL || ONEDRIVE_FLOW_URL.includes("COLLE_ICI")) {
            throw new Error("URL Power Automate non configurée dans app.js (ONEDRIVE_FLOW_URL).");
        }

        // text/plain pour éviter le preflight CORS
        const res = await fetch(ONEDRIVE_FLOW_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify(obj)
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

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
        return true;
    }

    // =========================
    // STATE
    // =========================

    const state = {
        session_id: newSessionId(),
        started_at_utc: nowIso(),

        participant_id: "",
        task_id: "",
        phase: "", // pre | post | retention
        consent: false,

        index: 0,
        answers: Array(QUIZ.questions.length).fill(null), // each = array of indices selected
        results: null,
        sentToOneDrive: false
    };

    // =========================
    // DOM
    // =========================

    const participantId = $("#participantId");
    const taskId = $("#taskId");
    const phase = $("#phase");
    const shareLink = $("#shareLink");
    const btnCopyLink = $("#btnCopyLink");
    const consentBox = $("#consentBox");
    const btnStart = $("#btnStart");

    const qHeader = $("#qHeader");
    const qText = $("#qText");
    const optionsBox = $("#options");
    const progress = $("#progress");
    const btnPrev = $("#btnPrev");
    const btnNext = $("#btnNext");

    const scoreEl = $("#score");
    const pctEl = $("#pct");
    const jsonPreview = $("#jsonPreview");
    const btnSendOneDrive = $("#btnSendOneDrive");
    const btnDownloadJson = $("#btnDownloadJson");
    const btnCopyJson = $("#btnCopyJson");
    const btnRestart = $("#btnRestart");

    // =========================
    // VALIDATION
    // =========================

    function validateParticipantId() {
        const v = participantId.value.trim();
        const ok = PARTICIPANT_ID_REGEX.test(v);

        participantId.classList.toggle("invalid", v !== "" && !ok);
        participantId.classList.toggle("valid", ok);

        participantId.setCustomValidity(
            ok || v === "" ? "" : "Format attendu : 3 MAJ + 3 min + nombre (ex. ABCdef12)"
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

    // Auto-correction de la casse (AAA bbb 123)
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
        if (!taskId.readOnly) {
            setUrlParam("task", taskId.value.trim());
            shareLink.value = shareableUrl();
        }
        refreshStartState();
    });

    phase.addEventListener("change", () => {
        // Update URL to include phase
        if (!phase.disabled) {
            setUrlParam("phase", phase.value.trim());
            shareLink.value = shareableUrl();
        }
        refreshStartState();
    });

    consentBox.addEventListener("change", refreshStartState);

    btnCopyLink.addEventListener("click", async () => {
        const ok = await copyToClipboard(shareLink.value);
        if (ok) {
            btnCopyLink.textContent = "Copié ✅";
            setTimeout(() => (btnCopyLink.textContent = "Copier"), 900);
        }
    });

    // =========================
    // INIT FROM URL
    // =========================

    function initFromUrl() {
        // task
        const t = getUrlParam("task");
        if (t) {
            taskId.value = t;
            taskId.readOnly = true;
            taskId.title = "Pré-rempli par l’URL (?task=...), non modifiable";
        } else {
            // si pas dans URL, on garde ce que l'utilisateur tapera et on l'écrit dans l'URL
            // (fait dans l'event input)
        }

        // phase
        const p = normalizePhase(getUrlParam("phase"));
        if (p) {
            phase.value = p;
            phase.disabled = true;
            phase.title = "Pré-rempli par l’URL (?phase=...), non modifiable";
        }

        // set share link field
        shareLink.value = shareableUrl();
    }

    // =========================
    // QUIZ
    // =========================

    function renderQuestion() {
        const q = QUIZ.questions[state.index];
        const total = QUIZ.questions.length;

        qHeader.textContent = `${state.index + 1}/${total} — Question`;
        qText.textContent = q.text;

        progress.style.width = `${Math.round((state.index / total) * 100)}%`;

        optionsBox.innerHTML = "";

        const selected = new Set(state.answers[state.index] ?? []);
        q.options.forEach((label, i) => {
            const wrap = document.createElement("label");
            wrap.className = "option";

            const input = document.createElement("input");
            input.type = q.multi ? "checkbox" : "radio";
            input.name = "q_" + q.id;
            input.checked = selected.has(i);

            input.addEventListener("change", () => {
                const cur = new Set(state.answers[state.index] ?? []);
                if (q.multi) {
                    if (input.checked) cur.add(i);
                    else cur.delete(i);
                } else {
                    cur.clear();
                    if (input.checked) cur.add(i);
                }
                state.answers[state.index] = Array.from(cur).sort((a, b) => a - b);
                btnNext.disabled = (state.answers[state.index].length === 0);
            });

            const p = document.createElement("p");
            p.className = "optionText";
            p.textContent = label;

            wrap.appendChild(input);
            wrap.appendChild(p);

            optionsBox.appendChild(wrap);
        });

        btnPrev.disabled = (state.index === 0);
        btnNext.textContent = (state.index === total - 1) ? "Terminer" : "Suivant";
        btnNext.disabled = ((state.answers[state.index] ?? []).length === 0);
    }

    function computeResults() {
        let correctCount = 0;

        const details = QUIZ.questions.map((q, idx) => {
            const ans = (state.answers[idx] ?? []).slice().sort((a, b) => a - b);
            const cor = (q.correct ?? []).slice().sort((a, b) => a - b);
            const ok = arraysEqual(ans, cor);
            if (ok) correctCount += 1;

            return {
                id: q.id,
                ok,
                answer_indices: ans,
                correct_indices: cor
            };
        });

        const total = QUIZ.questions.length;
        const pct = total ? (correctCount / total) * 100 : 0;

        return {
            instrument: QUIZ.title,
            version: QUIZ.version,

            session_id: state.session_id,
            timestamp_utc: nowIso(),
            started_at_utc: state.started_at_utc,

            participant_id: state.participant_id,
            task_id: state.task_id || null,
            phase: state.phase, // ✅ pre/post/retention

            n_questions: total,
            n_correct: correctCount,
            percent: Number(pct.toFixed(2)),

            answers: details
        };
    }

    function renderResults() {
        state.results = computeResults();

        scoreEl.textContent = `${state.results.n_correct} / ${state.results.n_questions}`;
        pctEl.textContent = `${state.results.percent} %`;

        const json = JSON.stringify(state.results, null, 2);
        jsonPreview.textContent = json;

        // export local
        btnDownloadJson.onclick = () => {
            const blob = new Blob([json], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "qcm_goutte_result.json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(a.href);
        };

        btnCopyJson.onclick = async () => {
            await copyToClipboard(json);
            btnCopyJson.textContent = "Copié ✅";
            setTimeout(() => (btnCopyJson.textContent = "Copier JSON"), 900);
        };

        // OneDrive obligatoire avant nouveau participant
        state.sentToOneDrive = false;
        btnRestart.disabled = true;

        btnSendOneDrive.disabled = false;
        btnSendOneDrive.textContent = "Envoyer vers OneDrive";

        btnSendOneDrive.onclick = async () => {
            const old = btnSendOneDrive.textContent;
            btnSendOneDrive.disabled = true;
            btnSendOneDrive.textContent = "Envoi…";

            try {
                await sendToOneDrive(state.results);
                state.sentToOneDrive = true;
                btnRestart.disabled = false;
                btnSendOneDrive.textContent = "Envoyé ✅";
            } catch (e) {
                btnSendOneDrive.textContent = old;
                btnSendOneDrive.disabled = false;
                alert("Échec envoi OneDrive : " + (e?.message || e));
            }
        };
    }

    // =========================
    // EVENTS
    // =========================

    btnStart.addEventListener("click", () => {
        refreshStartState();
        if (btnStart.disabled) return;

        showStep("quiz");
        renderQuestion();
    });

    btnPrev.addEventListener("click", () => {
        state.index = Math.max(0, state.index - 1);
        renderQuestion();
    });

    btnNext.addEventListener("click", () => {
        const total = QUIZ.questions.length;

        if (state.index === total - 1) {
            showStep("results");
            renderResults();
            progress.style.width = "100%";
            return;
        }

        state.index += 1;
        renderQuestion();
    });

    btnRestart.addEventListener("click", () => {
        if (!state.sentToOneDrive) return;

        // reset questionnaire (on garde task/phase car c'est souvent une session)
        state.session_id = newSessionId();
        state.started_at_utc = nowIso();

        state.index = 0;
        state.answers = Array(QUIZ.questions.length).fill(null);
        state.results = null;
        state.sentToOneDrive = false;

        participantId.value = "";
        participantId.classList.remove("valid", "invalid");
        const msg = $("#participantIdMsg");
        if (msg) msg.textContent = "Champ obligatoire";

        consentBox.checked = false;

        refreshStartState();
        showStep("welcome");
    });

    // =========================
    // BOOT
    // =========================

    $("#title").textContent = QUIZ.title;
    $("#subtitle").textContent = QUIZ.intro ?? "";
    $("#buildTag").textContent = QUIZ.version;

    initFromUrl();
    refreshStartState();
    showStep("welcome");
})();
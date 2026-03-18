// exam-qcm/app.js
(async () => {
    "use strict";

    // =========================
    // CONFIG — modifs faciles ici
    // =========================
    const CONFIG = {
        TIME_LIMIT_MINUTES: 45,      // 0 = pas de limite
        SHOW_TIMER: true,            // afficher/masquer le timer (le sticky reste)
        QUESTIONS_TO_ASK: 20,        // 🔥 prend N questions de la banque (si banque >= N)
        SHUFFLE_QUESTIONS: true,
        SHUFFLE_OPTIONS: true,

        // Correction automatique (score stocké dans le JSON, pas affiché)
        ENABLE_CLIENT_SIDE_SCORING: true,

        AUTO_SEND_TO_ONEDRIVE: true, // envoi auto à la fin
        SHOW_ANSWER_COUNT_END: false,
        SHOW_ANSWER_COUNT_DURING: false,
        SHOW_META: false,
        SOLUTIONS_PASSWORD: "MonMotDePasse2026",
    };

    // Session pour sauvegarder la progression en cas de mise à jour de la page
    const SESSION_STORAGE_KEY = "exam_qcm_runtime_v1";

    // Regex ID étudiant (modifiable)
    const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}'’\- ]*$/u;

    // Flow Power Automate
    const ONEDRIVE_FLOW_URL = "https://default566dadffe3a9465fb05eed73b33f0a.a5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cb00d62ebe664d88868b900782f19314/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=i5rz_DvOZ3Gs2Scv4xKjjpOvDkvFGZeiAHTyAJAZ8-c";

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

    function resolveVariants(questions) {

        return questions.map(q => {

            if (!q.variants) return q;

            const index = Math.floor(Math.random() * q.variants.length);
            const chosen = q.variants[index];

            return {
                ...q,
                ...chosen,
                variant_index: index
            };
        });
    }

    function buildCanonicalQuestionsForCorrection() {
        return QUIZ.questions.map((q, qIndex) => {
            if (q.variants && Array.isArray(q.variants) && q.variants.length > 0) {
                return {
                    id: q.id ?? `q${qIndex + 1}`,
                    variants: q.variants.map((variant) => ({
                        text: variant.text ?? "",
                        image: variant.image ?? null,
                        image_alt: variant.image_alt ?? variant.imageAlt ?? "",
                        multi: (variant.multi !== undefined)
                            ? !!variant.multi
                            : (Array.isArray(variant.correct) && variant.correct.length > 1),
                        points: (typeof variant.points === "number" && isFinite(variant.points))
                            ? variant.points
                            : (typeof q.points === "number" && isFinite(q.points) ? q.points : 1),
                        correct: Array.isArray(variant.correct) ? variant.correct.slice() : [],
                        explanation: variant.explanation ?? q.explanation ?? "",
                        options: (variant.options ?? []).map((opt, oi) => ({
                            orig_index: oi,
                            ...normalizeOption(opt)
                        }))
                    }))
                };
            }

            return {
                id: q.id ?? `q${qIndex + 1}`,
                text: q.text ?? "",
                image: q.image ?? null,
                image_alt: q.image_alt ?? q.imageAlt ?? "",
                multi: (q.multi !== undefined) ? !!q.multi : (Array.isArray(q.correct) && q.correct.length > 1),
                points: (typeof q.points === "number" && isFinite(q.points)) ? q.points : 1,
                correct: Array.isArray(q.correct) ? q.correct.slice() : [],
                explanation: q.explanation ?? "",
                options: (q.options ?? []).map((opt, oi) => ({
                    orig_index: oi,
                    ...normalizeOption(opt)
                }))
            };
        });
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
        $("#stepSolutionsLock").hidden = (step !== "solutionsLock");
        $("#stepSolutions").hidden = (step !== "solutions");
        $("#stepReview").hidden = (step !== "review");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function countAnsweredQuestions() {
        if (!state.presented || !state.presented.questions) return 0;
        let answered = 0;
        for (const q of state.presented.questions) {
            const sel = state.responses[q.id] ?? [];
            if (sel.length > 0) answered += 1;
        }
        return answered;
    }

    function countUnansweredQuestions() {
        if (!state.presented || !state.presented.questions) return 0;
        return state.presented.questions.length - countAnsweredQuestions();
    }

    function getRemainingSeconds() {
        if (!state.deadline_ms) return 0;
        return Math.max(0, Math.ceil((state.deadline_ms - Date.now()) / 1000));
    }

    function openSubmitConfirmModal() {
        const unanswered = countUnansweredQuestions();
        const remainingSeconds = getRemainingSeconds();

        if (unanswered > 0) {
            confirmMessage.textContent =
                `Il reste ${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse. Voulez-vous valider quand même ?`;
        } else if (remainingSeconds > 0) {
            confirmMessage.textContent =
                `Vous avez répondu à toutes les questions. Il vous reste ${formatDurationLong(remainingSeconds)} pour relire vos réponses si vous le souhaitez. Voulez-vous valider quand même ?`;
        } else {
            confirmMessage.textContent =
                `Voulez-vous valider votre questionnaire ?`;
        }

        confirmBackdrop.hidden = false;
    }

    function closeSubmitConfirmModal() {
        confirmBackdrop.hidden = true;
    }

    function saveRuntimeState(currentStep = null) {
        const payload = {
            currentStep,
            state: {
                session_id: state.session_id,
                started_at_utc: state.started_at_utc,
                participant_id: state.participant_id,
                consent: state.consent,

                presented: state.presented,
                responses: state.responses,

                deadline_ms: state.deadline_ms,
                finished: state.finished,
                timed_out: state.timed_out,

                results: state.results
            },
            form: {
                givenName: givenNameEl ? givenNameEl.value : "",
                familyName: familyNameEl ? familyNameEl.value : "",
                consent: consentBox ? consentBox.checked : false
            }
        };

        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    }

    function loadRuntimeState() {
        try {
            const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function clearRuntimeState() {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
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

    const confirmBackdrop = $("#confirmBackdrop");
    const confirmMessage = $("#confirmMessage");
    const btnCancelSubmit = $("#btnCancelSubmit");
    const btnConfirmSubmit = $("#btnConfirmSubmit");

    // =========================
    // STATE
    // =========================
    const state = {
        session_id: newSessionId(),
        started_at_utc: nowIso(),
        participant_id: "",
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
        saveRuntimeState("welcome");
    }

    // givenNameEl.addEventListener("blur", () => {
    //     givenNameEl.value = normalizeFirstName(givenNameEl.value);
    //     refreshStartState();
    // });

    // familyNameEl.addEventListener("blur", () => {
    //     familyNameEl.value = normalizeLastName(familyNameEl.value);
    //     refreshStartState();
    // });
    givenNameEl.addEventListener("blur", () => {
        givenNameEl.value = normalizeHumanName(givenNameEl.value);
        refreshStartState();
    });

    familyNameEl.addEventListener("blur", () => {
        familyNameEl.value = normalizeHumanName(familyNameEl.value);
        refreshStartState();
    });
    givenNameEl.addEventListener("input", refreshStartState);
    familyNameEl.addEventListener("input", refreshStartState);
    consentBox.addEventListener("change", refreshStartState);

    consentBox.addEventListener("change", refreshStartState);

    // =========================
    // PREFILL (task/phase) FROM URL
    // =========================
    // function initFromUrl() {
    //     const t = getUrlParam("task");
    //     if (t) { taskId.value = t; taskId.readOnly = true; }

    //     const p = normalizePhase(getUrlParam("phase"));
    //     if (p) { phase.value = p; phase.disabled = true; }
    // }
    function getMode() {
        const m = getUrlParam("mode").toLowerCase();
        if (["solutions", "review", "exam"].includes(m)) return m;
        return "exam";
    }
    function buildCanonicalQuestions() {
        return QUIZ.questions.map((q, qIndex) => ({
            id: q.id ?? `q${qIndex + 1}`,
            text: q.text ?? "",
            subtitle: q.subtitle ?? "",
            image: q.image ?? null,
            image_alt: q.image_alt ?? q.imageAlt ?? "",
            multi: (q.multi !== undefined) ? !!q.multi : (Array.isArray(q.correct) && q.correct.length > 1),
            points: (typeof q.points === "number" && isFinite(q.points)) ? q.points : 1,
            correct: Array.isArray(q.correct) ? q.correct.slice() : [],
            explanation: q.explanation ?? "",
            options: (q.options ?? []).map((opt, oi) => ({
                orig_index: oi,
                ...normalizeOption(opt)
            }))
        }));
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function getReviewStatus(question, selectedOriginal) {
        const correct = (question.correct ?? []).slice().sort((a, b) => a - b);
        const selected = (selectedOriginal ?? []).slice().sort((a, b) => a - b);

        if (selected.length === 0) {
            return { kind: "empty", label: "Non répondu" };
        }

        const hasWrong = selected.some(i => !correct.includes(i));
        if (hasWrong) {
            return { kind: "bad", label: "Incorrect" };
        }

        if (arraysEqual(selected, correct)) {
            return { kind: "good", label: "Correct" };
        }

        return { kind: "partial", label: "Partiellement correct" };
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

        const sourceQuestions = resolveVariants(QUIZ.questions);

        const pool = sourceQuestions.map((q, qIndex) => ({
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
        const normalized = selectedPresentedIndices
            .map(Number)
            .filter((n) => Number.isInteger(n))
            .sort((a, b) => a - b);

        state.responses[qid] = normalized;
        updateAnsweredPill();
        saveRuntimeState("quiz");
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
            title.innerHTML = `${qi + 1}. ${q.text}`;
            if (q.subtitle) {
                const sub = document.createElement("p");
                sub.className = "qSubtitle";
                sub.textContent = q.subtitle;
                card.appendChild(sub);
            }
            card.appendChild(title);

            if (q.image) {
                const img = document.createElement("img");
                img.className = "qImg";
                img.src = q.image;
                img.alt = q.image_alt || "Image de la question";
                img.loading = "lazy";
                card.appendChild(img);
            }

            if (CONFIG.SHOW_META) {
                const meta = document.createElement("p");
                meta.className = "qMeta";
                meta.textContent = q.multi ? "Plusieurs réponses possibles. (Vous pouvez laisser vide.)"
                    : "Une seule réponse possible. (Vous pouvez laisser vide.)";
                card.appendChild(meta);
            }

            const groupName = `grp_${q.id}`;

            q.options.forEach((opt, oi) => {
                const label = document.createElement("label");
                label.className = "option";

                const input = document.createElement("input");
                input.type = q.multi ? "checkbox" : "radio";
                input.name = groupName;
                input.value = String(oi);

                // input.addEventListener("change", () => {
                //     const inputs = card.querySelectorAll(`input[name="${groupName}"]`);
                //     const selected = [];
                //     inputs.forEach((el) => { if (el.checked) selected.push(Number(el.value)); });
                //     setResponse(q.id, selected);
                // });
                input.addEventListener("input", () => {
                    const inputs = card.querySelectorAll(`input[name="${groupName}"]`);
                    const selected = Array.from(inputs)
                        .filter((el) => el.checked)
                        .map((el) => Number(el.value));

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
    function unlockSolutions() {
        const input = $("#solutionsPassword");
        const msg = $("#solutionsPasswordMsg");
        const value = input.value;

        if (value === CONFIG.SOLUTIONS_PASSWORD) {
            sessionStorage.setItem("solutions_unlocked", "1");
            input.classList.remove("invalid");
            msg.textContent = "";
            renderSolutions();
            showStep("solutions");
        } else {
            input.classList.add("invalid");
            msg.textContent = "Mot de passe incorrect.";
        }
    }

    function initSolutionsLock() {
        const input = $("#solutionsPassword");
        const btn = $("#btnUnlockSolutions");
        const msg = $("#solutionsPasswordMsg");

        btn.addEventListener("click", unlockSolutions);

        input.addEventListener("input", () => {
            input.classList.remove("invalid");
            msg.textContent = "";
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                unlockSolutions();
            }
        });
    }
    function renderCorrectionQuestionCard(container, q) {
        const card = document.createElement("div");
        card.className = "qCard";

        const title = document.createElement("p");
        title.className = "qTitle";
        title.innerHTML = `${q.indexLabel}. ${q.text}`;
        card.appendChild(title);

        if (q.image) {
            const img = document.createElement("img");
            img.className = "qImg";
            img.src = q.image;
            img.alt = q.image_alt || "Image de la question";
            img.loading = "lazy";
            card.appendChild(img);
        }

        q.options.forEach((opt) => {
            const row = document.createElement("div");
            row.className = "option";
            if (q.correct.includes(opt.orig_index)) {
                row.classList.add("solutionGood");
            }

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

            row.appendChild(body);
            card.appendChild(row);
        });

        container.appendChild(card);
    }

    function renderSolutions() {
        const list = $("#solutionsList");
        list.innerHTML = "";

        const questions = buildCanonicalQuestionsForCorrection();

        questions.forEach((q, qi) => {
            if (q.variants) {
                q.variants.forEach((variant, vi) => {
                    renderCorrectionQuestionCard(list, {
                        id: `${q.id}_v${vi + 1}`,
                        indexLabel: `${qi + 1}.${vi + 1}`,
                        ...variant
                    });
                });
            } else {
                renderCorrectionQuestionCard(list, {
                    id: q.id,
                    indexLabel: `${qi + 1}`,
                    ...q
                });
            }
        });
    }
    function findReviewedQuestionDefinition(answerEntry) {
        const questions = buildCanonicalQuestionsForCorrection();
        const q = questions.find((item) => item.id === answerEntry.question_id);
        if (!q) return null;

        if (!q.variants) return q;

        const presentedSignature = JSON.stringify(
            (answerEntry.options_presented ?? []).map((o) => ({
                orig_index: o.orig_index,
                text: o.text ?? "",
                image: o.image ?? null
            }))
        );

        const matchedVariant = q.variants.find((variant) => {
            const variantSignature = JSON.stringify(
                variant.options.map((o) => ({
                    orig_index: o.orig_index,
                    text: o.text ?? "",
                    image: o.image ?? null
                }))
            );
            return variantSignature === presentedSignature;
        });

        return matchedVariant ?? q.variants[0];
    }
    function renderReviewFromJson(reviewData) {
        const list = $("#reviewList");
        const summary = $("#reviewSummary");
        list.innerHTML = "";

        const questions = buildCanonicalQuestions();
        const byId = new Map(questions.map(q => [q.id, q]));

        const answers = Array.isArray(reviewData.answers) ? reviewData.answers : [];

        const givenName = reviewData.givenName ?? "";
        const familyName = reviewData.familyName ?? "";
        const scoreTotal = reviewData.score_total ?? "—";
        const scoreMax = reviewData.score_max ?? "—";
        const scorePercent = reviewData.score_percent ?? "—";

        summary.textContent = `${givenName} ${familyName} — Score : ${scoreTotal}/${scoreMax} (${scorePercent}%)`;

        answers.forEach((a, idx) => {
            const q = findReviewedQuestionDefinition(a);
            if (!q) return;

            const selectedOriginal = Array.isArray(a.selected_original_indices) ? a.selected_original_indices : [];
            const statusInfo = getReviewStatus(q, selectedOriginal);

            const card = document.createElement("div");
            card.className = "qCard";

            const title = document.createElement("p");
            title.className = "qTitle";
            title.innerHTML = `${idx + 1}. ${q.text}`;
            card.appendChild(title);

            if (q.subtitle) {
                const sub = document.createElement("p");
                sub.className = "qSubtitle";
                sub.textContent = q.subtitle;
                card.appendChild(sub);
            }

            if (q.image) {
                const img = document.createElement("img");
                img.className = "qImg";
                img.src = q.image;
                img.alt = q.image_alt || "Image de la question";
                img.loading = "lazy";
                card.appendChild(img);
            }

            q.options.forEach((opt) => {
                const row = document.createElement("div");
                row.className = "option";

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

                const isCorrect = q.correct.includes(opt.orig_index);
                const isSelected = selectedOriginal.includes(opt.orig_index);

                if (isCorrect) {
                    row.classList.add("solutionGood");
                }

                if (isSelected && !isCorrect) {
                    row.classList.add("solutionUserWrong");
                }

                if (isSelected && isCorrect && statusInfo.kind === "partial") {
                    row.classList.add("solutionUserPartial");
                }

                row.appendChild(body);
                card.appendChild(row);
            });

            const status = document.createElement("div");
            status.className = `reviewStatus ${statusInfo.kind}`;
            status.textContent = statusInfo.label;
            card.appendChild(status);

            if (q.explanation) {
                const exp = document.createElement("div");
                exp.className = "explanationBox";
                exp.textContent = q.explanation;
                card.appendChild(exp);
            }

            list.appendChild(card);
        });
    }
    function initReviewMode() {
        const reviewFile = $("#reviewFile");

        reviewFile.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const json = JSON.parse(text);
                renderReviewFromJson(json);
            } catch (err) {
                console.error(err);
                $("#reviewSummary").textContent = "Impossible de lire ce fichier JSON.";
                $("#reviewList").innerHTML = "";
            }
        });
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
        saveRuntimeState("quiz");

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
    function syncResponsesFromDom() {
        if (!state.presented || !state.presented.questions) return;

        for (const q of state.presented.questions) {
            const card = document.querySelector(`#q_${q.id}`);
            if (!card) continue;

            const groupName = `grp_${q.id}`;
            const selected = Array.from(card.querySelectorAll(`input[name="${groupName}"]`))
                .filter((el) => el.checked)
                .map((el) => Number(el.value))
                .sort((a, b) => a - b);

            state.responses[q.id] = selected;
        }

        saveRuntimeState("quiz");
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
        // const first_name = normalizeFirstName(givenNameEl.value);
        // const last_name = normalizeLastName(familyNameEl.value);
        const first_name = normalizeHumanName(givenNameEl.value);
        const last_name = normalizeHumanName(familyNameEl.value);
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
        syncResponsesFromDom();
        state.finished = true;
        state.timed_out = !!timedOut;
        stopTimer();
        disableQuizInputs();

        state.results = computeResults();
        saveRuntimeState("results");

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
                clearRuntimeState();
                state.finished = true;
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
    function restoreRenderedResponses() {
        if (!state.presented || !state.presented.questions) return;

        for (const q of state.presented.questions) {
            const selected = state.responses[q.id] ?? [];
            const groupName = `grp_${q.id}`;
            const card = document.querySelector(`#q_${q.id}`);
            if (!card) continue;

            const inputs = card.querySelectorAll(`input[name="${groupName}"]`);
            inputs.forEach((el) => {
                el.checked = selected.includes(Number(el.value));
            });
        }

        updateAnsweredPill();
    }
    function restoreRuntimeState() {
        const saved = loadRuntimeState();
        if (!saved || !saved.state) return false;

        const s = saved.state;
        const f = saved.form || {};

        state.session_id = s.session_id ?? newSessionId();
        state.started_at_utc = s.started_at_utc ?? nowIso();
        state.participant_id = s.participant_id ?? "";
        state.consent = !!s.consent;

        state.presented = s.presented ?? null;
        state.responses = s.responses ?? {};

        state.deadline_ms = s.deadline_ms ?? null;
        state.finished = !!s.finished;
        state.timed_out = !!s.timed_out;

        state.results = s.results ?? null;

        if (givenNameEl) givenNameEl.value = f.givenName ?? "";
        if (familyNameEl) familyNameEl.value = f.familyName ?? "";
        if (consentBox) consentBox.checked = !!f.consent;

        refreshStartState();

        if (saved.currentStep === "quiz" && state.presented && !state.finished) {
            renderAllQuestions();
            restoreRenderedResponses();

            // // restaurer les cases cochées
            // for (const q of state.presented.questions) {
            //     const selected = state.responses[q.id] ?? [];
            //     const groupName = `grp_${q.id}`;
            //     const card = document.querySelector(`#q_${q.id}`);
            //     if (!card) continue;

            //     const inputs = card.querySelectorAll(`input[name="${groupName}"]`);
            //     inputs.forEach((el) => {
            //         el.checked = selected.includes(Number(el.value));
            //     });
            // }

            // relancer le timer avec la deadline existante
            if (state.deadline_ms && !state.finished) {
                timerPill.hidden = !CONFIG.SHOW_TIMER;

                const tick = () => {
                    const remaining = state.deadline_ms - Date.now();
                    if (CONFIG.SHOW_TIMER) {
                        timerPill.textContent = `Temps restant : ${formatDurationLong(remaining / 1000)}`;
                    }
                    if (remaining <= 0) {
                        stopTimer();
                        finish(true);
                    }
                };

                tick();
                state.timerHandle = setInterval(tick, 250);
            }

            showStep("quiz");
            return true;
        }

        if (saved.currentStep === "results" && state.results) {
            if (DEBUG) {
                debugPanel.hidden = false;
                jsonPreview.textContent = JSON.stringify(state.results, null, 2);
            }
            showStep("results");
            return true;
        }

        showStep("welcome");
        return true;
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
        saveRuntimeState("quiz");

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

    btnSubmit.addEventListener("click", () => {
        openSubmitConfirmModal();
    });
    btnCancelSubmit.addEventListener("click", () => {
        closeSubmitConfirmModal();
    });

    btnConfirmSubmit.addEventListener("click", () => {
        closeSubmitConfirmModal();
        finish(false);
    });
    confirmBackdrop.addEventListener("click", (e) => {
        if (e.target === confirmBackdrop) {
            closeSubmitConfirmModal();
        }
    });

    // =========================
    // BOOT
    // =========================
    $("#title").textContent = QUIZ.title;
    $("#subtitle").textContent = QUIZ.intro ?? "";
    $("#buildTag").textContent = QUIZ.version;

    window.addEventListener("beforeunload", (e) => {
        if (!state.finished && state.presented && getMode() === "exam") {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    if (durationHint) {
        durationHint.textContent = formatDurationHint(CONFIG.TIME_LIMIT_MINUTES);
    }

    timerPill.hidden = true;
    answeredPill.hidden = !CONFIG.SHOW_ANSWER_COUNT_DURING;

    const mode = getMode();

    if (mode === "solutions") {
        $("#subtitle").textContent = "Mode correction générale";

        initSolutionsLock();

        const alreadyUnlocked = sessionStorage.getItem("solutions_unlocked") === "1";
        if (alreadyUnlocked) {
            renderSolutions();
            showStep("solutions");
        } else {
            showStep("solutionsLock");
        }
    } else if (mode === "review") {
        $("#subtitle").textContent = "Mode correction personnalisée";
        initReviewMode();
        showStep("review");
    } else {
        const restored = restoreRuntimeState();
        if (!restored) {
            refreshStartState();
            showStep("welcome");
        }
    }
})();
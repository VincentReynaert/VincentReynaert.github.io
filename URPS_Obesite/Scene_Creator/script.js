const dom = {
    imageInput: document.getElementById("imageInput"),
    spaceToggle: document.getElementById("spaceToggle"),
    viewport: document.getElementById("viewport"),
    scene: document.getElementById("scene"),
    grid: document.getElementById("grid"),
    objectLayer: document.getElementById("objectLayer"),
    hierarchy: document.getElementById("hierarchy"),
    contextMenu: document.getElementById("contextMenu"),
    renameBtn: document.getElementById("renameBtn"),
    deleteBtn: document.getElementById("deleteBtn"),
    gizmo: document.getElementById("gizmo"),
    axisX: document.querySelector(".axis-x"),
    axisY: document.querySelector(".axis-y"),
    rotateHandle: document.querySelector(".rotate-handle"),
    posXInput: document.getElementById("posX"),
    posYInput: document.getElementById("posY"),
    rotationInput: document.getElementById("rotation"),
    scaleXInput: document.getElementById("scaleX"),
    scaleYInput: document.getElementById("scaleY"),
    resetRotationBtn: document.getElementById("resetRotationBtn"),
    resetScaleBtn: document.getElementById("resetScaleBtn"),
    hiddenInput: document.getElementById("hiddenInput"),
    inspectorTabs: document.getElementById("inspectorTabs"),
    svgExportAction: document.getElementById("svgExportAction"),
    svgInspector: document.getElementById("svgInspector"),
    rigInspector: document.getElementById("rigInspector"),
    exportSceneBtn: document.getElementById("exportSceneBtn"),
    exportModal: document.getElementById("exportModal"),
    exportModeRow: document.getElementById("exportModeRow"),
    exportFixedFields: document.getElementById("exportFixedFields"),
    exportWidthInput: document.getElementById("exportWidth"),
    exportHeightInput: document.getElementById("exportHeight"),
    exportNameInput: document.getElementById("exportName"),
    exportCancelBtn: document.getElementById("exportCancelBtn"),
    exportConfirmBtn: document.getElementById("exportConfirmBtn"),
    sceneImportInput: document.getElementById("sceneImportInput"),
    selectionBox: document.getElementById("selectionBox")
};

const state = {
    objects: [],
    selected: null,
    selectedObjects: [],
    transformSpace: "local",
    contextTarget: null,
    draggedHierarchyItem: null,
    rigSliderActive: false,
    activeInspectorTab: "svg",
    history: [],
    historyIndex: -1,
    _rigBeforeSnapshot: null,
    camera: {
        x: 0,
        y: 0,
        zoom: 1
    },
    interaction: {
        type: null,
        axis: null,
        startSceneMouse: null,
        startObjectPosition: null,
        startGroupPositions: null,
        groupCenter: null,
        lastMouse: null,
        beforeSnapshot: null,
        beforeRigSnapshot: null
    }
};

const VIEWPORT = {
    sceneSize: 5000,
    minZoom: 0.2,
    maxZoom: 3,
    zoomStep: 0.1
};

const SPRITE = {
    defaultX: 300,
    defaultY: 300,
    defaultWidth: 200,
    minScale: 0.05
};

// Configuration generique du rig humanoide avec hierarchie
const RIG_CONFIG = {
    Head: { pivot: "Neck", label: "Tete", parent: null, range: { rotation: [-25, 25], x: [-20, 20], y: [-20, 20] } },

    LeftArm: { pivot: "LeftShoulder", label: "Bras gauche", parent: null, range: { rotation: [-90, 90], x: [-50, 50], y: [-50, 50] } },
    LeftForearm: { pivot: "LeftElbow", label: "Avant-bras gauche", parent: "LeftArm", range: { rotation: [-120, 120], x: [-50, 50], y: [-50, 50] } },

    RightArm: { pivot: "RightShoulder", label: "Bras droit", parent: null, range: { rotation: [-90, 90], x: [-50, 50], y: [-50, 50] } },
    RightForearm: { pivot: "RightElbow", label: "Avant-bras droit", parent: "RightArm", range: { rotation: [-120, 120], x: [-50, 50], y: [-50, 50] } },

    LeftLeg: { pivot: "LeftHip", label: "Jambe haute gauche", parent: null, range: { rotation: [-60, 60], x: [-30, 30], y: [-30, 30] } },
    LeftLowerLeg: { pivot: "LeftKnee", label: "Jambe basse gauche", parent: "LeftLeg", range: { rotation: [0, 80], x: [-30, 30], y: [-30, 30] } },

    RightLeg: { pivot: "RightHip", label: "Jambe haute droit", parent: null, range: { rotation: [-60, 60], x: [-30, 30], y: [-30, 30] } },
    RightLowerLeg: { pivot: "RightKnee", label: "Jambe basse droit", parent: "RightLeg", range: { rotation: [0, 80], x: [-30, 30], y: [-30, 30] } },

    LeftEye: {
        label: "Oeil gauche",
        parent: "Head",
        aliases: ["LeftEye", "Eye1"],
        controls: [
            { key: "scaleY", label: "Clignement", min: 0.05, max: 1, step: 0.01, unit: "x", defaultValue: 1 }
        ]
    },
    RightEye: {
        label: "Oeil droit",
        parent: "Head",
        aliases: ["RightEye", "Eye2"],
        controls: [
            { key: "scaleY", label: "Clignement", min: 0.05, max: 1, step: 0.01, unit: "x", defaultValue: 1 }
        ]
    },
    LeftEyebrow: {
        label: "Sourcil gauche",
        parent: "Head",
        aliases: ["LeftEyebrow", "Eyebrow1"],
        controls: [
            { key: "y", label: "Y", min: -20, max: 20, step: 1, unit: "px", defaultValue: 0 }
        ]
    },
    RightEyebrow: {
        label: "Sourcil droit",
        parent: "Head",
        aliases: ["RightEyebrow", "Eyebrow2"],
        controls: [
            { key: "y", label: "Y", min: -20, max: 20, step: 1, unit: "px", defaultValue: 0 }
        ]
    }
};

function getPartControls(config) {
    if (Array.isArray(config.controls) && config.controls.length > 0) {
        return config.controls;
    }

    return [
        { key: "rotation", label: "Rotation", min: config.range.rotation[0], max: config.range.rotation[1], step: 1, unit: "deg", defaultValue: 0 },
        { key: "x", label: "X", min: config.range.x[0], max: config.range.x[1], step: 1, unit: "px", defaultValue: 0 },
        { key: "y", label: "Y", min: config.range.y[0], max: config.range.y[1], step: 1, unit: "px", defaultValue: 0 }
    ];
}

function getDefaultPose(controls) {
    const pose = {};
    controls.forEach((control) => {
        pose[control.key] = Number.isFinite(control.defaultValue) ? control.defaultValue : 0;
    });
    return pose;
}

function findRigPartElement(mainGroup, partName, config) {
    const aliases = [partName, ...(config.aliases || [])];

    for (const alias of aliases) {
        const byGroupId = mainGroup.querySelector(`g#${cssEscape(alias)}`);
        if (byGroupId) return byGroupId;

        const byAnyId = mainGroup.querySelector(`#${cssEscape(alias)}`);
        if (byAnyId && byAnyId !== mainGroup) return byAnyId;
    }

    const parentAliases = config.parentAliases || [];
    const selectors = config.selectors || [];
    for (const parentAlias of parentAliases) {
        const parent = mainGroup.querySelector(`#${cssEscape(parentAlias)}`);
        if (!parent) continue;

        for (const selector of selectors) {
            const candidate = parent.querySelector(selector);
            if (candidate) return candidate;
        }
    }

    return null;
}

const scaleHandles = createScaleHandles();

disableNativeDrag(dom.axisX, dom.axisY, dom.rotateHandle, ...scaleHandles);
bindEvents();
updateCamera();
updateInspector({ refreshSvg: true });
updateGizmo();

function bindEvents() {
    dom.imageInput.addEventListener("change", handleImageImport);
    dom.spaceToggle.addEventListener("click", toggleTransformSpace);

    dom.scene.addEventListener("mousedown", handleSceneMouseDown);
    dom.viewport.addEventListener("mousedown", handleViewportMouseDown);
    dom.viewport.addEventListener("wheel", handleViewportWheel, { passive: false });

    dom.axisX.addEventListener("mousedown", (event) => startGizmoMove(event, "x"));
    dom.axisY.addEventListener("mousedown", (event) => startGizmoMove(event, "y"));
    dom.rotateHandle.addEventListener("mousedown", startGizmoRotation);
    scaleHandles.forEach((handle) => {
        handle.addEventListener("mousedown", (event) => startScale(event, handle.dataset.scaleHandle));
    });

    dom.renameBtn.addEventListener("click", renameContextTarget);
    dom.deleteBtn.addEventListener("click", deleteContextTarget);

    dom.posXInput.addEventListener("input", () => updateSelectedFromInspector("x", dom.posXInput.value));
    dom.posYInput.addEventListener("input", () => updateSelectedFromInspector("y", dom.posYInput.value));
    dom.rotationInput.addEventListener("input", () => updateSelectedFromInspector("rotation", dom.rotationInput.value));
    dom.scaleXInput.addEventListener("input", () => updateSelectedFromInspector("scaleX", dom.scaleXInput.value));
    dom.scaleYInput.addEventListener("input", () => updateSelectedFromInspector("scaleY", dom.scaleYInput.value));
    dom.resetRotationBtn.addEventListener("click", resetSelectedRotation);
    dom.resetScaleBtn.addEventListener("click", resetSelectedScale);
    dom.hiddenInput.addEventListener("change", updateSelectedHidden);
    [dom.posXInput, dom.posYInput, dom.rotationInput, dom.scaleXInput, dom.scaleYInput].forEach((input) => {
        let snap = null;
        input.addEventListener("focus", () => { if (state.selected) snap = snapshotTransform(state.selected); });
        input.addEventListener("blur", () => {
            if (snap && state.selected) {
                pushHistory(state.selected, snap, null, snapshotTransform(state.selected), null);
                snap = null;
            }
        });
    });
    dom.rigInspector.addEventListener("input", handleRigInspectorInput);
    dom.rigInspector.addEventListener("click", handleRigInspectorClick);
    dom.rigInspector.addEventListener("pointerdown", handleRigInspectorPointerDown);
    dom.inspectorTabs.addEventListener("click", (e) => {
        const tab = e.target.closest("[data-tab]");
        if (!tab) return;
        state.activeInspectorTab = tab.dataset.tab;
        syncInspectorTabs();
    });
    dom.exportSceneBtn.addEventListener("click", openExportModal);
    dom.exportCancelBtn.addEventListener("click", closeExportModal);
    dom.exportConfirmBtn.addEventListener("click", confirmExport);
    dom.exportModal.addEventListener("click", (e) => { if (e.target === dom.exportModal) closeExportModal(); });
    dom.exportModal.addEventListener("keydown", (e) => { if (e.key === "Escape") closeExportModal(); });
    document.querySelectorAll("input[name='exportMode']").forEach((radio) => {
        radio.addEventListener("change", () => {
            dom.exportFixedFields.hidden = radio.value !== "fixed" || !radio.checked;
        });
    });
    document.querySelectorAll("input[name='exportFormat']").forEach((radio) => {
        radio.addEventListener("change", () => {
            const isSvg = radio.value === "svg" && radio.checked;
            dom.exportModeRow.hidden = isSvg;
            if (isSvg) dom.exportFixedFields.hidden = true;
        });
    });
    dom.sceneImportInput.addEventListener("change", handleSceneImport);
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", stopInteraction);
    document.addEventListener("pointerup", handleRigInspectorPointerUp);
    document.addEventListener("keydown", handleDocumentKeyDown);

    setupPanelResizer(
        document.getElementById("hierarchyResizer"),
        document.getElementById("hierarchy-panel"),
        "right"
    );
    setupPanelResizer(
        document.getElementById("inspectorResizer"),
        document.getElementById("inspector-panel"),
        "left"
    );
}

function setupPanelResizer(resizer, panel, side) {
    let startX, startWidth;

    resizer.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = panel.offsetWidth;
        resizer.classList.add("dragging");
        resizer.setPointerCapture(e.pointerId);
    });

    resizer.addEventListener("pointermove", (e) => {
        if (!resizer.hasPointerCapture(e.pointerId)) return;
        const delta = e.clientX - startX;
        const newWidth = side === "right"
            ? Math.max(150, Math.min(600, startWidth + delta))
            : Math.max(150, Math.min(600, startWidth - delta));
        const prevWidth = panel.offsetWidth;
        panel.style.width = `${newWidth}px`;
        panel.style.flexBasis = `${newWidth}px`;
        if (side === "right") {
            state.camera.x -= panel.offsetWidth - prevWidth;
            updateCamera();
        }
    });

    resizer.addEventListener("pointerup", () => {
        resizer.classList.remove("dragging");
    });
}

function disableNativeDrag(...elements) {
    elements.forEach((element) => {
        if (element) element.draggable = false;
    });
}

function createScaleHandles() {
    const frame = document.createElement("div");
    frame.className = "scale-frame";
    dom.scaleFrame = frame;
    dom.gizmo.appendChild(frame);

    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((name) => {
        const handle = document.createElement("div");

        handle.className = `scale-handle scale-handle-${name}`;
        handle.dataset.scaleHandle = name;
        handle.title = `Scale ${name.toUpperCase()}`;

        frame.appendChild(handle);
        return handle;
    });

    return handles;
}

function handleImageImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        if (isSvgFile(file)) {
            createSvgSprite(reader.result, file.name);
            return;
        }

        createBitmapSprite(reader.result, file.name);
    });

    if (isSvgFile(file)) {
        reader.readAsText(file);
    } else {
        reader.readAsDataURL(file);
    }

    event.target.value = "";
}

function handleSceneImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        importSceneFromSvg(reader.result);
    });
    reader.readAsText(file);
    event.target.value = "";
}

function importSceneFromSvg(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");

    if (doc.querySelector("parsererror")) {
        alert("Le fichier SVG n'a pas pu ÃƒÂªtre importÃƒÂ©.");
        return;
    }

    const spriteGroups = [...doc.querySelectorAll("g[data-scene-sprite]")];

    if (spriteGroups.length === 0) {
        alert("Aucun sprite de scÃƒÂ¨ne trouvÃƒÂ© dans ce fichier SVG.\nAssurez-vous d'importer un fichier exportÃƒÂ© depuis Scene Creator.");
        return;
    }

    spriteGroups.forEach((g) => {
        const name = g.getAttribute("data-name") || "Sprite";
        const type = g.getAttribute("data-type") || "svg";
        const x = parseFloat(g.getAttribute("data-x")) || SPRITE.defaultX;
        const y = parseFloat(g.getAttribute("data-y")) || SPRITE.defaultY;
        const rotation = parseFloat(g.getAttribute("data-rotation")) || 0;
        const scaleX = parseFloat(g.getAttribute("data-scale-x")) ?? 1;
        const scaleY = parseFloat(g.getAttribute("data-scale-y")) ?? 1;
        const width = parseFloat(g.getAttribute("data-width")) || SPRITE.defaultWidth;

        if (type === "svg") {
            const svgEl = g.querySelector("svg");
            if (!svgEl) return;
            const imported = document.importNode(svgEl, true);
            imported.removeAttribute("x");
            imported.removeAttribute("y");
            imported.setAttribute("overflow", "visible");
            imported.classList.add("svg-content");
            createImportedSvgSprite(imported, name, { x, y, rotation, scaleX, scaleY, width });
        } else if (type === "bitmap") {
            const imgEl = g.querySelector("image");
            if (!imgEl) return;
            const href = imgEl.getAttribute("href") || imgEl.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
            if (!href) return;
            createImportedBitmapSprite(href, name, { x, y, rotation, scaleX, scaleY, width });
        }
    });
}

function createImportedSvgSprite(svgEl, name, transform) {
    sanitizeSvg(svgEl);

    const sprite = document.createElement("div");
    const objectData = {
        id: createId(),
        name,
        type: "svg",
        x: transform.x,
        y: transform.y,
        rotation: transform.rotation,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        hidden: Boolean(transform.hidden)
    };

    sprite.svgClassMap = namespaceSvgClasses(svgEl, objectData.id);
    sprite.className = "sprite svg-sprite";
    sprite.objectData = objectData;
    sprite.svgElement = svgEl;
    sprite.svgStyles = extractSvgStyleData(svgEl, sprite.svgClassMap);
    sprite.style.width = `${transform.width || SPRITE.defaultWidth}px`;
    sprite.appendChild(svgEl);
    sprite.addEventListener("mousedown", (event) => startSpriteMove(event, sprite));

    dom.objectLayer.appendChild(sprite);
    state.objects.push(sprite);

    sprite.hierarchyItem = createHierarchyItem(sprite);
    updateSprite(sprite);
    refreshSceneOrder();
    selectObject(sprite);
    refreshSpriteLayout(sprite);
}

function createImportedBitmapSprite(src, name, transform) {
    const image = document.createElement("img");
    const objectData = {
        id: createId(),
        name,
        type: "bitmap",
        x: transform.x,
        y: transform.y,
        rotation: transform.rotation,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        hidden: Boolean(transform.hidden)
    };

    image.src = src;
    image.alt = name;
    image.draggable = false;
    image.className = "sprite";
    image.objectData = objectData;
    image.style.width = `${transform.width || SPRITE.defaultWidth}px`;
    image.addEventListener("mousedown", (event) => startSpriteMove(event, image));
    image.addEventListener("load", () => refreshSpriteLayout(image), { once: true });

    dom.objectLayer.appendChild(image);
    state.objects.push(image);

    image.hierarchyItem = createHierarchyItem(image);
    updateSprite(image);
    refreshSceneOrder();
    selectObject(image);
    refreshSpriteLayout(image);
}

function createBitmapSprite(src, fileName) {
    const image = document.createElement("img");
    const objectData = createObjectData(fileName, "bitmap");

    image.src = src;
    image.alt = objectData.name;
    image.draggable = false;
    image.className = "sprite";
    image.objectData = objectData;
    image.style.width = `${SPRITE.defaultWidth}px`;
    image.addEventListener("mousedown", (event) => startSpriteMove(event, image));
    image.addEventListener("load", () => refreshSpriteLayout(image), { once: true });

    dom.objectLayer.appendChild(image);
    state.objects.push(image);

    image.hierarchyItem = createHierarchyItem(image);
    updateSprite(image);
    refreshSceneOrder();
    selectObject(image);
    refreshSpriteLayout(image);
}

function createSvgSprite(svgText, fileName) {
    const svg = parseSvg(svgText);
    if (!svg) {
        alert("Le fichier SVG n'a pas pu etre importe.");
        return;
    }

    const sprite = document.createElement("div");
    const objectData = createObjectData(fileName, "svg");

    sanitizeSvg(svg);
    sprite.svgClassMap = namespaceSvgClasses(svg, objectData.id);
    svg.removeAttribute("x");
    svg.removeAttribute("y");
    svg.setAttribute("overflow", "visible");
    svg.classList.add("svg-content");

    sprite.className = "sprite svg-sprite";
    sprite.objectData = objectData;
    sprite.svgElement = svg;
    sprite.svgStyles = extractSvgStyleData(svg, sprite.svgClassMap);
    sprite.style.width = `${SPRITE.defaultWidth}px`;
    sprite.appendChild(svg);
    sprite.addEventListener("mousedown", (event) => startSpriteMove(event, sprite));

    dom.objectLayer.appendChild(sprite);
    state.objects.push(sprite);

    sprite.hierarchyItem = createHierarchyItem(sprite);
    updateSprite(sprite);
    refreshSceneOrder();
    selectObject(sprite);
    refreshSpriteLayout(sprite);
}

function createObjectData(fileName, type) {
    return {
        id: createId(),
        name: getDefaultObjectName(fileName),
        type,
        x: SPRITE.defaultX,
        y: SPRITE.defaultY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        hidden: false
    };
}

function getDefaultObjectName(fileName) {
    if (!fileName) return `Sprite ${state.objects.length + 1}`;
    return fileName.replace(/\.[^/.]+$/, "") || `Sprite ${state.objects.length + 1}`;
}

function isSvgFile(file) {
    return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

function createId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `sprite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseSvg(svgText) {
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(svgText, "image/svg+xml");

    if (parsedDocument.querySelector("parsererror")) return null;

    const svg = parsedDocument.documentElement;
    if (svg?.tagName.toLowerCase() !== "svg") return null;

    return document.importNode(svg, true);
}

function sanitizeSvg(svg) {
    svg.querySelectorAll("script, foreignObject").forEach((element) => element.remove());

    svg.querySelectorAll("*").forEach((element) => {
        [...element.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();

            if (name.startsWith("on") || value.startsWith("javascript:")) {
                element.removeAttribute(attribute.name);
            }
        });
    });
}

function namespaceSvgClasses(svg, objectId) {
    const namespace = `svg-${objectId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const classNames = getAllSvgClassNames(svg);
    const classMap = Object.fromEntries(
        classNames.map((className) => [className, `${namespace}-${className}`])
    );

    const styleElement = svg.querySelector("style");
    if (styleElement) {
        let styleText = styleElement.textContent;

        Object.entries(classMap).forEach(([className, scopedClassName]) => {
            styleText = styleText.replace(
                new RegExp(`\\.${escapeRegExp(className)}\\b`, "g"),
                `.${scopedClassName}`
            );
        });

        styleElement.textContent = styleText;
    }

    svg.querySelectorAll("[class]").forEach((element) => {
        Object.entries(classMap).forEach(([className, scopedClassName]) => {
            if (element.classList.contains(className)) {
                element.classList.remove(className);
                element.classList.add(scopedClassName);
            }
        });
    });

    return classMap;
}

function extractSvgStyleData(svg, classMap = null) {
    const styleElement = getOrCreateSvgStyleElement(svg);
    const allClasses = classMap
        ? Object.keys(classMap)
        : getAllSvgClassNames(svg);

    const classes = allClasses.filter((className) => {
        const scopedClassName = classMap?.[className] || className;
        return svgClassHasFill(styleElement.textContent, scopedClassName, svg);
    });

    return classes.map((className) => {
        const scopedClassName = classMap?.[className] || className;

        return {
            className,
            scopedClassName,
            color: getSvgClassFill(styleElement.textContent, scopedClassName, svg),
            alpha: getSvgClassAlpha(styleElement.textContent, scopedClassName, svg),
            targetIds: getSvgClassTargetIds(svg, scopedClassName)
        };
    });
}

function svgClassHasFill(styleText, className, svg) {
    const escapedClass = escapeRegExp(className);
    const rule = styleText.match(new RegExp(`\\.${escapedClass}\\s*\\{([^}]*)\\}`));
    if (rule?.[1]?.match(/fill\s*:/i)) return true;

    const element = svg.querySelector(`.${cssEscape(className)}`);
    return Boolean(
        normalizeHexColor(element?.getAttribute("fill")) ||
        normalizeHexColor(element?.style.fill)
    );
}

function getOrCreateSvgStyleElement(svg) {
    let styleElement = svg.querySelector("style");

    if (!styleElement) {
        styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleElement.setAttribute("type", "text/css");
        svg.prepend(styleElement);
    }

    return styleElement;
}

function getSvgStyleClasses(svg) {
    const styleElement = getOrCreateSvgStyleElement(svg);
    return getAllSvgClassNames(svg)
        .filter((className) => svgClassHasFill(styleElement.textContent, className, svg))
        .sort(compareStClasses);
}

function getAllSvgClassNames(svg) {
    const classNames = new Set();
    const styleText = svg.querySelector("style")?.textContent || "";
    const ruleRegex = /\.([a-zA-Z_][\w-]*)\s*\{/g;
    let match = ruleRegex.exec(styleText);

    while (match) {
        classNames.add(match[1]);
        match = ruleRegex.exec(styleText);
    }

    svg.querySelectorAll("[class]").forEach((element) => {
        element.classList.forEach((className) => {
            classNames.add(className);
        });
    });

    return [...classNames];
}

function compareStClasses(a, b) {
    const aNumber = parseInt(a.replace(/\D/g, ""), 10);
    const bNumber = parseInt(b.replace(/\D/g, ""), 10);

    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
        return aNumber - bNumber;
    }

    return a.localeCompare(b);
}

function getSvgClassFill(styleText, className, svg) {
    const escapedClass = escapeRegExp(className);
    const rule = styleText.match(new RegExp(`\\.${escapedClass}\\s*\\{([^}]*)\\}`));
    const fill = rule?.[1].match(/fill\s*:\s*([^;]+)\s*;?/i)?.[1];
    const color = normalizeHexColor(fill);

    if (color) return color;

    const element = svg.querySelector(`.${cssEscape(className)}`);
    return normalizeHexColor(element?.getAttribute("fill"))
        || normalizeHexColor(element?.style.fill)
        || "#000000";
}

function getSvgClassAlpha(styleText, className, svg) {
    const escapedClass = escapeRegExp(className);
    const rule = styleText.match(new RegExp(`\\.${escapedClass}\\s*\\{([^}]*)\\}`));
    const fromFillOpacity = normalizeAlphaValue(rule?.[1].match(/fill-opacity\s*:\s*([^;]+)\s*;?/i)?.[1]);
    if (fromFillOpacity != null) return fromFillOpacity;

    const fromOpacity = normalizeAlphaValue(rule?.[1].match(/opacity\s*:\s*([^;]+)\s*;?/i)?.[1]);
    if (fromOpacity != null) return fromOpacity;

    const element = svg.querySelector(`.${cssEscape(className)}`);
    return normalizeAlphaValue(
        element?.getAttribute("fill-opacity")
        || element?.style.fillOpacity
        || element?.getAttribute("opacity")
        || element?.style.opacity
    ) ?? 1;
}

function getSvgClassTargetIds(svg, className) {
    return [...svg.querySelectorAll(`.${cssEscape(className)}`)]
        .map((element) => getAssociatedSvgId(element, svg))
        .filter(Boolean)
        .filter((id, index, ids) => ids.indexOf(id) === index);
}

function getAssociatedSvgId(element, svg) {
    if (element.id) return element.id;

    let parent = element.parentElement;
    while (parent && parent !== svg) {
        if (parent.id) return parent.id;
        parent = parent.parentElement;
    }

    return "";
}

function updateSvgClassColor(sprite, className, color, alpha = null) {
    const hex = normalizeHexColor(color);
    if (!hex || !sprite.svgElement) return false;

    const currentStyle = sprite.svgStyles?.find((style) => style.scopedClassName === className);
    const normalizedAlpha = normalizeAlphaValue(alpha);
    const nextAlpha = normalizedAlpha ?? currentStyle?.alpha ?? 1;
    const alphaText = formatSvgAlpha(nextAlpha);

    const styleElement = getOrCreateSvgStyleElement(sprite.svgElement);
    const escapedClass = escapeRegExp(className);
    const ruleRegex = new RegExp(`(\\.${escapedClass}\\s*\\{)([^}]*)(\\})`);
    const rule = styleElement.textContent.match(ruleRegex);

    if (rule) {
        let body = rule[2].match(/fill\s*:/i)
            ? rule[2].replace(/fill\s*:\s*[^;]+;?/i, `fill:${hex};`)
            : `${rule[2].trim().replace(/;?$/, ";")}fill:${hex};`;

        body = body.match(/fill-opacity\s*:/i)
            ? body.replace(/fill-opacity\s*:\s*[^;]+;?/i, `fill-opacity:${alphaText};`)
            : `${body.trim().replace(/;?$/, ";")}fill-opacity:${alphaText};`;

        styleElement.textContent = styleElement.textContent.replace(ruleRegex, (_, start, __, end) => `${start}${body}${end}`);
    } else {
        styleElement.textContent += `\n.${className}{fill:${hex};fill-opacity:${alphaText};}`;
    }

    sprite.svgStyles = sprite.svgStyles.map((style) => (
        style.scopedClassName === className
            ? { ...style, color: hex, alpha: nextAlpha }
            : style
    ));

    return true;
}

function createHierarchyItem(sprite) {
    const item = document.createElement("div");
    const label = document.createElement("span");
    const button = document.createElement("button");

    item.className = "hierarchy-item";
    item.draggable = true;

    label.className = "hierarchy-label";
    label.textContent = sprite.objectData.name;

    button.type = "button";
    button.className = "hierarchy-actions-btn";
    button.textContent = "...";
    button.setAttribute("aria-label", `Actions pour ${sprite.objectData.name}`);

    item.append(label, button);
    dom.hierarchy.appendChild(item);

    item.addEventListener("click", () => selectObject(sprite));
    item.addEventListener("dragstart", () => startHierarchyDrag(item));
    item.addEventListener("dragover", (event) => moveHierarchyItem(event, item));
    item.addEventListener("dragend", finishHierarchyDrag);
    item.addEventListener("drop", finishHierarchyDrag);

    label.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        startInlineRename(label, sprite);
    });

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        openContextMenu(event.clientX, event.clientY, sprite);
    });

    return item;
}

function startHierarchyDrag(item) {
    state.draggedHierarchyItem = item;
    item.classList.add("dragging");
}

function moveHierarchyItem(event, item) {
    event.preventDefault();
    if (!state.draggedHierarchyItem || state.draggedHierarchyItem === item) return;

    const rect = item.getBoundingClientRect();
    const insertBefore = event.clientY - rect.top < rect.height / 2;

    dom.hierarchy.insertBefore(
        state.draggedHierarchyItem,
        insertBefore ? item : item.nextSibling
    );
}

function finishHierarchyDrag(event) {
    event?.preventDefault();
    document.querySelectorAll(".hierarchy-item").forEach((item) => {
        item.classList.remove("dragging");
    });
    state.draggedHierarchyItem = null;
    refreshSceneOrder();
}

function refreshSceneOrder() {
    const orderedObjects = [...dom.hierarchy.children]
        .map((item) => state.objects.find((object) => object.hierarchyItem === item))
        .filter(Boolean);

    state.objects.length = 0;
    state.objects.push(...orderedObjects);

    state.objects.forEach((object, index) => {
        object.style.zIndex = index + 1;
        dom.objectLayer.appendChild(object);
    });
}

function openContextMenu(x, y, sprite) {
    state.contextTarget = sprite;
    dom.contextMenu.style.left = `${x}px`;
    dom.contextMenu.style.top = `${y}px`;
    dom.contextMenu.classList.remove("hidden");
}

function closeContextMenu() {
    dom.contextMenu.classList.add("hidden");
}

function renameContextTarget() {
    const sprite = state.contextTarget;
    if (!sprite) return;

    const newName = prompt("Nouveau nom de l'objet :", sprite.objectData.name);
    if (!newName?.trim()) return;

    setObjectName(sprite, newName.trim());
    closeContextMenu();
}

function deleteContextTarget() {
    if (!state.contextTarget) return;
    selectObject(state.contextTarget);
    deleteSelectedObject();
    closeContextMenu();
}

function startInlineRename(label, sprite) {
    const oldName = sprite.objectData.name;
    const input = document.createElement("input");
    let isFinished = false;

    input.type = "text";
    input.value = oldName;
    input.className = "hierarchy-rename-input";
    label.replaceWith(input);
    input.focus();
    input.select();

    const finish = (shouldCommit) => {
        if (isFinished) return;
        isFinished = true;

        const newLabel = document.createElement("span");
        const name = shouldCommit && input.value.trim() ? input.value.trim() : oldName;

        setObjectName(sprite, name);
        newLabel.className = "hierarchy-label";
        newLabel.textContent = sprite.objectData.name;
        newLabel.addEventListener("dblclick", (event) => {
            event.stopPropagation();
            startInlineRename(newLabel, sprite);
        });

        if (input.parentNode) input.replaceWith(newLabel);
    };

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            finish(true);
        }

        if (event.key === "Escape") {
            event.preventDefault();
            finish(false);
        }
    });

    input.addEventListener("blur", () => finish(true), { once: true });
}

function setObjectName(sprite, name) {
    sprite.objectData.name = name;
    sprite.alt = name;

    const label = sprite.hierarchyItem?.querySelector(".hierarchy-label");
    if (label) label.textContent = name;

    const button = sprite.hierarchyItem?.querySelector(".hierarchy-actions-btn");
    if (button) button.setAttribute("aria-label", `Actions pour ${name}`);
}

function selectObject(sprite) {
    if (!sprite?.objectData) return;

    stopInteraction();
    state.selected = sprite;
    state.selectedObjects = [sprite];

    state.objects.forEach((object) => {
        const isSelected = object === sprite;
        object.classList.toggle("selected", isSelected);
        object.hierarchyItem?.classList.toggle("hierarchy-selected", isSelected);
    });

    updateInspector({ refreshSvg: true });
    updateGizmo();
}

function deselectAll() {
    stopInteraction();
    state.selected = null;
    state.selectedObjects = [];

    state.objects.forEach((object) => {
        object.classList.remove("selected");
        object.hierarchyItem?.classList.remove("hierarchy-selected");
    });

    updateInspector({ refreshSvg: true });
    updateGizmo();
}

function updateInspector(options = {}) {
    const { refreshSvg = false } = options;
    const isMulti = state.selectedObjects.length > 1;
    const data = isMulti ? null : state.selected?.objectData;

    dom.posXInput.value = data ? Math.round(data.x) : "";
    dom.posYInput.value = data ? Math.round(data.y) : "";
    dom.rotationInput.value = data ? Math.round(data.rotation) : "";
    dom.scaleXInput.value = data ? formatScale(data.scaleX) : "";
    dom.scaleYInput.value = data ? formatScale(data.scaleY) : "";
    dom.hiddenInput.checked = data ? Boolean(data.hidden) : false;
    dom.hiddenInput.disabled = !data;

    if (refreshSvg) {
        if (isMulti) {
            dom.svgInspector.replaceChildren();
            dom.svgInspector.hidden = true;
            dom.svgExportAction.replaceChildren();
            dom.svgExportAction.hidden = true;
            dom.rigInspector.replaceChildren();
            dom.rigInspector.hidden = true;
            dom.inspectorTabs.hidden = true;
        } else {
            updateSvgInspector();
            updateRigInspector();
            syncInspectorTabs();
        }
    }
}

function updateSvgInspector() {
    const sprite = state.selected;

    dom.svgInspector.replaceChildren();
    dom.svgInspector.hidden = true;
    dom.svgExportAction.replaceChildren();
    dom.svgExportAction.hidden = true;

    if (!sprite?.svgElement) return;

    sprite.svgStyles = extractSvgStyleData(sprite.svgElement, sprite.svgClassMap);
    dom.svgInspector.hidden = false;

    const title = document.createElement("div");
    title.className = "svg-inspector-title";
    title.textContent = "Couleurs SVG";
    dom.svgInspector.appendChild(title);

    if (sprite.svgStyles.length === 0) {
        const empty = document.createElement("div");
        empty.className = "svg-inspector-empty";
        empty.textContent = "Aucune classe .st trouvee.";
        dom.svgInspector.appendChild(empty);
    } else {
        sprite.svgStyles.forEach((style) => {
            dom.svgInspector.appendChild(createSvgColorField(sprite, style));
        });
    }

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.textContent = "Export SVG";
    exportBtn.addEventListener("click", () => exportSvg(sprite));
    dom.svgExportAction.appendChild(exportBtn);
    dom.svgExportAction.hidden = false;
}

function exportSvg(sprite) {
    if (!sprite?.svgElement) return;

    const w = sprite.offsetWidth || SPRITE.defaultWidth;
    const h = sprite.offsetHeight || sprite.offsetWidth || SPRITE.defaultWidth;
    const { clone } = buildExportSvgForCanvas(sprite, w, h);
    clone.removeAttribute("x");
    clone.removeAttribute("y");

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${sprite.objectData.name}.svg`;
    link.click();

    URL.revokeObjectURL(url);
}

function openExportModal() {
    if (state.objects.length === 0) { alert("La scÃƒÂ¨ne est vide."); return; }
    dom.exportModal.hidden = false;
}

function closeExportModal() {
    dom.exportModal.hidden = true;
}

async function confirmExport() {
    const format = document.querySelector("input[name='exportFormat']:checked")?.value || "png";
    const mode = document.querySelector("input[name='exportMode']:checked")?.value;
    const fixedW = parseInt(dom.exportWidthInput.value, 10);
    const fixedH = parseInt(dom.exportHeightInput.value, 10);
    const filename = dom.exportNameInput.value.trim() || "scene";
    closeExportModal();
    if (format === "svg") {
        doExportSceneSvg(filename);
    } else if (mode === "fixed" && fixedW > 0 && fixedH > 0) {
        await doExportScene(fixedW, fixedH, filename);
    } else {
        await doExportScene(null, null, filename);
    }
}

function getSvgExportLocalRect(sprite, w, h) {
    const svgEl = sprite.svgElement;
    const vb = svgEl?.viewBox?.baseVal;

    if (!svgEl || !vb || vb.width === 0) {
        return { x: -w / 2, y: -h / 2, width: w, height: h };
    }

    const contentBounds = computeSvgContentViewBox(svgEl, vb);
    const svgUnitPerPxX = vb.width / w;
    const svgUnitPerPxY = vb.height / h;

    const drawW = contentBounds.width / svgUnitPerPxX;
    const drawH = contentBounds.height / svgUnitPerPxY;
    const drawX = -w / 2 + (contentBounds.x - vb.x) / svgUnitPerPxX;
    const drawY = -h / 2 + (contentBounds.y - vb.y) / svgUnitPerPxY;

    return { x: drawX, y: drawY, width: drawW, height: drawH };
}

function getSpriteExportLocalRect(sprite, w, h) {
    if (sprite.objectData.type === "svg" && sprite.svgElement) {
        return getSvgExportLocalRect(sprite, w, h);
    }

    return { x: -w / 2, y: -h / 2, width: w, height: h };
}

function expandBoundsWithSprite(bounds, sprite, localRect, w, h) {
    const { x, y, rotation, scaleX, scaleY } = sprite.objectData;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rad = rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const corners = [
        [localRect.x, localRect.y],
        [localRect.x + localRect.width, localRect.y],
        [localRect.x + localRect.width, localRect.y + localRect.height],
        [localRect.x, localRect.y + localRect.height]
    ];

    corners.forEach(([lx, ly]) => {
        const sx = lx * scaleX;
        const sy = ly * scaleY;
        const wx = cx + sx * cos - sy * sin;
        const wy = cy + sx * sin + sy * cos;
        bounds.minX = Math.min(bounds.minX, wx);
        bounds.minY = Math.min(bounds.minY, wy);
        bounds.maxX = Math.max(bounds.maxX, wx);
        bounds.maxY = Math.max(bounds.maxY, wy);
    });
}

async function doExportScene(fixedWidth, fixedHeight, filename = "scene") {
    // Calcul du bounding box de la scÃƒÂ¨ne
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

    state.objects.forEach((sprite) => {
        const w = sprite.offsetWidth;
        const h = sprite.offsetHeight;
        const localRect = getSpriteExportLocalRect(sprite, w, h);
        expandBoundsWithSprite(bounds, sprite, localRect, w, h);
    });

    const contentMinX = Math.floor(bounds.minX);
    const contentMinY = Math.floor(bounds.minY);
    const contentW = Math.max(1, Math.ceil(bounds.maxX - contentMinX));
    const contentH = Math.max(1, Math.ceil(bounds.maxY - contentMinY));

    let canvasW, canvasH, drawScaleX, drawScaleY, offsetX, offsetY;
    if (fixedWidth && fixedHeight) {
        canvasW = fixedWidth;
        canvasH = fixedHeight;
        // Scale independently on each axis so an overflow on width does not shrink height (and inverse).
        drawScaleX = fixedWidth / contentW;
        drawScaleY = fixedHeight / contentH;
        offsetX = (fixedWidth - contentW * drawScaleX) / 2;
        offsetY = (fixedHeight - contentH * drawScaleY) / 2;
    } else {
        canvasW = contentW;
        canvasH = contentH;
        drawScaleX = 1;
        drawScaleY = 1;
        offsetX = 0;
        offsetY = 0;
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");

    if (drawScaleX !== 1 || drawScaleY !== 1 || offsetX !== 0 || offsetY !== 0) {
        ctx.translate(offsetX, offsetY);
        ctx.scale(drawScaleX, drawScaleY);
    }

    const serializer = new XMLSerializer();

    for (const sprite of state.objects) {
        const { x, y, rotation, scaleX, scaleY } = sprite.objectData;
        const w = sprite.offsetWidth;
        const h = sprite.offsetHeight;

        ctx.save();
        ctx.translate(x + w / 2 - contentMinX, y + h / 2 - contentMinY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(scaleX, scaleY);

        try {
            if (sprite.objectData.type === "svg") {
                const { clone, drawX, drawY, drawW, drawH } = buildExportSvgForCanvas(sprite, w, h);
                const svgStr = serializer.serializeToString(clone);
                const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                try {
                    const img = await loadImageFromUrl(url);
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                } finally {
                    URL.revokeObjectURL(url);
                }
            } else {
                const img = await loadImageFromUrl(sprite.src);
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
            }
        } catch (e) {
            console.warn("Erreur lors du rendu du sprite:", e);
        }

        ctx.restore();
    }

    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.png`;
        link.click();
        URL.revokeObjectURL(url);
    }, "image/png");
}

function doExportSceneSvg(filename = "scene") {
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

    state.objects.forEach((sprite) => {
        const w = sprite.offsetWidth;
        const h = sprite.offsetHeight;
        const localRect = getSpriteExportLocalRect(sprite, w, h);
        expandBoundsWithSprite(bounds, sprite, localRect, w, h);
    });

    const contentMinX = Math.floor(bounds.minX);
    const contentMinY = Math.floor(bounds.minY);
    const contentW = Math.max(1, Math.ceil(bounds.maxX - contentMinX));
    const contentH = Math.max(1, Math.ceil(bounds.maxY - contentMinY));

    const ns = "http://www.w3.org/2000/svg";
    const svgRoot = document.createElementNS(ns, "svg");
    svgRoot.setAttribute("xmlns", ns);
    svgRoot.setAttribute("viewBox", `${contentMinX} ${contentMinY} ${contentW} ${contentH}`);
    svgRoot.setAttribute("width", contentW);
    svgRoot.setAttribute("height", contentH);

    for (const sprite of state.objects) {
        const { x, y, rotation, scaleX, scaleY, name, type } = sprite.objectData;
        const w = sprite.offsetWidth;
        const h = sprite.offsetHeight;
        const cx = x + w / 2;
        const cy = y + h / 2;

        const g = document.createElementNS(ns, "g");
        g.setAttribute("data-scene-sprite", "true");
        g.setAttribute("data-name", name);
        g.setAttribute("data-type", type);
        g.setAttribute("data-x", x);
        g.setAttribute("data-y", y);
        g.setAttribute("data-rotation", rotation);
        g.setAttribute("data-scale-x", scaleX);
        g.setAttribute("data-scale-y", scaleY);
        g.setAttribute("data-width", w);
        g.setAttribute("data-height", h);
        g.setAttribute("transform", `translate(${cx}, ${cy}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`);

        if (type === "svg" && sprite.svgElement) {
            const { clone, drawX, drawY } = buildExportSvgForCanvas(sprite, w, h);
            deNamespaceSvg(clone, sprite.svgClassMap);
            clone.removeAttribute("overflow");
            clone.setAttribute("x", drawX);
            clone.setAttribute("y", drawY);
            g.appendChild(clone);
        } else if (type === "bitmap" && sprite.src) {
            const img = document.createElementNS(ns, "image");
            img.setAttribute("href", sprite.src);
            img.setAttribute("x", -w / 2);
            img.setAttribute("y", -h / 2);
            img.setAttribute("width", w);
            img.setAttribute("height", h);
            g.appendChild(img);
        }

        svgRoot.appendChild(g);
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRoot);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.svg`;
    link.click();
    URL.revokeObjectURL(url);
}

function deNamespaceSvg(svgClone, classMap) {
    if (!classMap || Object.keys(classMap).length === 0) return;

    // Sort scoped names by length descending to avoid partial replacement
    const entries = Object.entries(classMap).sort((a, b) => b[1].length - a[1].length);

    const styleEl = svgClone.querySelector("style");
    if (styleEl) {
        let styleText = styleEl.textContent;
        entries.forEach(([orig, scoped]) => {
            styleText = styleText.split(`.${scoped}`).join(`.${orig}`);
        });
        styleEl.textContent = styleText;
    }

    svgClone.querySelectorAll("[class]").forEach((el) => {
        entries.forEach(([orig, scoped]) => {
            if (el.classList.contains(scoped)) {
                el.classList.remove(scoped);
                el.classList.add(orig);
            }
        });
    });
}

// Construit un clone SVG avec un viewBox ÃƒÂ©tendu pour inclure les parties de rig
// qui dÃƒÂ©passent du cadre original, et retourne les coordonnÃƒÂ©es de dessin canvas.
function buildExportSvgForCanvas(sprite, w, h) {
    const svgEl = sprite.svgElement;
    const clone = svgEl.cloneNode(true);
    clone.removeAttribute("overflow");
    const localRect = getSvgExportLocalRect(sprite, w, h);

    if (svgEl.viewBox?.baseVal?.width > 0 && svgEl.viewBox?.baseVal?.height > 0) {
        const vb = svgEl.viewBox.baseVal;
        const svgUnitPerPxX = vb.width / w;
        const svgUnitPerPxY = vb.height / h;
        const contentBounds = {
            x: vb.x + (localRect.x + w / 2) * svgUnitPerPxX,
            y: vb.y + (localRect.y + h / 2) * svgUnitPerPxY,
            width: localRect.width * svgUnitPerPxX,
            height: localRect.height * svgUnitPerPxY
        };

        clone.setAttribute("viewBox", `${contentBounds.x} ${contentBounds.y} ${contentBounds.width} ${contentBounds.height}`);
    }

    clone.setAttribute("width", localRect.width);
    clone.setAttribute("height", localRect.height);

    return {
        clone,
        drawX: localRect.x,
        drawY: localRect.y,
        drawW: localRect.width,
        drawH: localRect.height
    };
}

// Calcule en coordonnÃƒÂ©es SVG le bounding box rÃƒÂ©el du contenu (incluant les transforms de rig).
function computeSvgContentViewBox(svgEl, vb) {
    let minX = vb.x, minY = vb.y;
    let maxX = vb.x + vb.width, maxY = vb.y + vb.height;

    try {
        const svgCTM = svgEl.getScreenCTM();
        if (svgCTM) {
            const svgCTMInv = svgCTM.inverse();

            svgEl.querySelectorAll("g[id]").forEach((el) => {
                try {
                    const bbox = el.getBBox();
                    if (bbox.width === 0 && bbox.height === 0) return;

                    const elCTM = el.getScreenCTM();
                    if (!elCTM) return;

                    const toViewport = svgCTMInv.multiply(elCTM);

                    [
                        [bbox.x, bbox.y],
                        [bbox.x + bbox.width, bbox.y],
                        [bbox.x + bbox.width, bbox.y + bbox.height],
                        [bbox.x, bbox.y + bbox.height]
                    ].forEach(([px, py]) => {
                        const pt = svgEl.createSVGPoint();
                        pt.x = px;
                        pt.y = py;
                        const { x, y } = pt.matrixTransform(toViewport);
                        if (Number.isFinite(x) && Number.isFinite(y)) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    });
                } catch (e) { /* ignorer les ÃƒÂ©lÃƒÂ©ments incompatibles */ }
            });
        }
    } catch (e) { /* utiliser le viewBox d'origine en cas d'erreur */ }

    const originalMinX = vb.x;
    const originalMinY = vb.y;
    const originalMaxX = vb.x + vb.width;
    const originalMaxY = vb.y + vb.height;
    const overflowEpsilon = 0.001;
    const overflowsX = minX < originalMinX - overflowEpsilon || maxX > originalMaxX + overflowEpsilon;
    const overflowsY = minY < originalMinY - overflowEpsilon || maxY > originalMaxY + overflowEpsilon;
    const pad = Math.max(vb.width, vb.height) * 0.02;
    const exportMinX = overflowsX ? minX - pad : originalMinX;
    const exportMaxX = overflowsX ? maxX + pad : originalMaxX;
    const exportMinY = overflowsY ? minY - pad : originalMinY;
    const exportMaxY = overflowsY ? maxY + pad : originalMaxY;

    return {
        x: exportMinX,
        y: exportMinY,
        width: exportMaxX - exportMinX,
        height: exportMaxY - exportMinY
    };
}

function loadImageFromUrl(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Impossible de charger: ${src}`));
        img.src = src;
    });
}

function createSvgColorField(sprite, style) {
    const row = document.createElement("div");
    const meta = document.createElement("div");
    const ids = document.createElement("div");
    const controls = document.createElement("div");
    const picker = document.createElement("input");
    const textInput = document.createElement("input");
    const alphaControls = document.createElement("div");
    const alphaRange = document.createElement("input");
    const alphaInput = document.createElement("input");

    row.className = "svg-color-row";
    meta.className = "svg-color-meta";
    ids.className = "svg-class-ids";
    controls.className = "svg-color-controls";
    alphaControls.className = "svg-alpha-controls";

    const initialHex = normalizeHexColor(style.color) || "#000000";
    const initialAlpha = normalizeAlphaValue(style.alpha) ?? 1;

    picker.type = "color";
    picker.className = "svg-color-picker";
    picker.value = initialHex;

    textInput.type = "text";
    textInput.className = "svg-color-input";
    textInput.value = initialHex;
    textInput.placeholder = "#RRGGBB";
    textInput.spellcheck = false;
    textInput.setAttribute("aria-label", `Couleur de .${style.className}`);

    alphaRange.type = "range";
    alphaRange.className = "svg-alpha-range";
    alphaRange.min = "0";
    alphaRange.max = "1";
    alphaRange.step = "0.01";
    alphaRange.value = formatSvgAlpha(initialAlpha);

    alphaInput.type = "number";
    alphaInput.className = "svg-alpha-input";
    alphaInput.min = "0";
    alphaInput.max = "1";
    alphaInput.step = "0.01";
    alphaInput.value = formatSvgAlpha(initialAlpha);
    alphaInput.setAttribute("aria-label", `Alpha de .${style.className}`);

    ids.textContent = style.targetIds.length > 0
        ? style.targetIds.join(", ")
        : "Aucun id associe";

    let pickerSnap = null;
    picker.addEventListener("pointerdown", () => {
        pickerSnap = snapshotSvgColors(sprite);
    });
    picker.addEventListener("input", () => {
        const hex = picker.value.toUpperCase();
        textInput.value = hex;
        textInput.classList.remove("invalid");
        updateSvgClassColor(sprite, style.scopedClassName, hex, alphaRange.value);
    });
    picker.addEventListener("change", () => {
        if (pickerSnap) {
            pushColorHistory(sprite, pickerSnap, snapshotSvgColors(sprite));
            pickerSnap = null;
        }
    });

    let textSnap = null;
    textInput.addEventListener("focus", () => { textSnap = snapshotSvgColors(sprite); });
    textInput.addEventListener("input", () => {
        const normalized = normalizeHexColor(textInput.value);
        const isValid = Boolean(normalized);
        textInput.classList.toggle("invalid", !isValid);
        if (isValid) {
            picker.value = normalized;
            updateSvgClassColor(sprite, style.scopedClassName, normalized, alphaRange.value);
        }
    });
    textInput.addEventListener("blur", () => {
        if (textSnap) {
            pushColorHistory(sprite, textSnap, snapshotSvgColors(sprite));
            textSnap = null;
        }
    });

    let alphaSnap = null;
    alphaRange.addEventListener("pointerdown", () => {
        alphaSnap = snapshotSvgColors(sprite);
    });
    alphaRange.addEventListener("input", () => {
        const nextAlpha = normalizeAlphaValue(alphaRange.value);
        if (nextAlpha == null) return;
        alphaInput.value = formatSvgAlpha(nextAlpha);
        alphaInput.classList.remove("invalid");
        updateSvgClassColor(sprite, style.scopedClassName, picker.value, nextAlpha);
    });
    alphaRange.addEventListener("change", () => {
        if (alphaSnap) {
            pushColorHistory(sprite, alphaSnap, snapshotSvgColors(sprite));
            alphaSnap = null;
        }
    });

    let alphaTextSnap = null;
    alphaInput.addEventListener("focus", () => { alphaTextSnap = snapshotSvgColors(sprite); });
    alphaInput.addEventListener("input", () => {
        const nextAlpha = normalizeAlphaValue(alphaInput.value);
        const isValid = nextAlpha != null;
        alphaInput.classList.toggle("invalid", !isValid);
        if (!isValid) return;

        const alphaText = formatSvgAlpha(nextAlpha);
        alphaRange.value = alphaText;
        alphaInput.value = alphaText;
        updateSvgClassColor(sprite, style.scopedClassName, picker.value, nextAlpha);
    });
    alphaInput.addEventListener("blur", () => {
        const nextAlpha = normalizeAlphaValue(alphaInput.value);
        if (nextAlpha != null) {
            const alphaText = formatSvgAlpha(nextAlpha);
            alphaInput.value = alphaText;
            alphaRange.value = alphaText;
        }
        if (alphaTextSnap) {
            pushColorHistory(sprite, alphaTextSnap, snapshotSvgColors(sprite));
            alphaTextSnap = null;
        }
    });

    alphaControls.append(alphaRange, alphaInput);
    controls.append(picker, textInput, alphaControls);
    meta.append(ids);
    row.append(meta, controls);

    return row;
}

function updateRigInspector() {
    const sprite = state.selected;

    dom.rigInspector.replaceChildren();
    dom.rigInspector.hidden = true;

    if (!sprite?.svgElement) return;

    ensureSvgRig(sprite);
    dom.rigInspector.hidden = false;

    const title = document.createElement("div");
    title.className = "rig-inspector-title";
    title.textContent = "Rig SVG";

    const actions = document.createElement("div");
    actions.className = "rig-actions";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.dataset.rigAction = "reset";
    resetButton.textContent = "Reset rig";

    actions.appendChild(resetButton);
    dom.rigInspector.append(title, actions);

    const globalControls = createRigGlobalControls(sprite);
    if (globalControls) {
        dom.rigInspector.appendChild(globalControls);
    }

    if (sprite.svgRig.parts.length === 0) {
        const empty = document.createElement("div");
        empty.className = "rig-inspector-empty";
        empty.textContent = "Aucun groupe SVG avec id trouve.";
        dom.rigInspector.appendChild(empty);
        return;
    }

    sprite.svgRig.parts.forEach((part) => {
        dom.rigInspector.appendChild(createRigPartControls(part));
    });
}

function findRigPart(sprite, key) {
    return sprite?.svgRig?.parts?.find((part) => part.key === key) || null;
}

function createRigGlobalControls(sprite) {
    const leftEye = findRigPart(sprite, "LeftEye");
    const rightEye = findRigPart(sprite, "RightEye");
    const leftEyebrow = findRigPart(sprite, "LeftEyebrow");
    const rightEyebrow = findRigPart(sprite, "RightEyebrow");

    const canLinkEyes = Boolean(leftEye && rightEye);
    const canLinkEyebrows = Boolean(leftEyebrow && rightEyebrow);

    if (!canLinkEyes && !canLinkEyebrows) return null;

    const wrapper = document.createElement("div");
    const title = document.createElement("div");
    wrapper.className = "rig-global-controls";
    title.className = "rig-inspector-title";
    title.textContent = "Visage (symetrie)";
    wrapper.appendChild(title);

    if (canLinkEyes) {
        const value = (Number(leftEye.pose.scaleY) + Number(rightEye.pose.scaleY)) / 2;
        wrapper.appendChild(createRigGlobalSlider({
            key: "eyesBlink",
            label: "Clignement yeux (L+R)",
            min: 0.05,
            max: 1,
            step: 0.01,
            unit: "x",
            value
        }));
    }

    if (canLinkEyebrows) {
        const value = (Number(leftEyebrow.pose.y) + Number(rightEyebrow.pose.y)) / 2;
        wrapper.appendChild(createRigGlobalSlider({
            key: "eyebrowsY",
            label: "Sourcils Y (L+R)",
            min: -20,
            max: 20,
            step: 1,
            unit: "px",
            value
        }));
    }

    return wrapper;
}

function createRigGlobalSlider(config) {
    const field = document.createElement("label");
    const header = document.createElement("span");
    const output = document.createElement("output");
    const input = document.createElement("input");

    field.className = "rig-slider";
    header.textContent = config.label;
    output.value = formatRigValue(config.value, config.unit);

    input.type = "range";
    input.min = config.min;
    input.max = config.max;
    input.step = config.step;
    input.value = config.value;
    input.dataset.rigGlobal = config.key;
    input.dataset.rigUnit = config.unit;

    field.append(header, output, input);
    return field;
}

function syncInspectorTabs() {
    const hasSvg = dom.svgInspector.children.length > 0;
    const hasRig = dom.rigInspector.children.length > 0;

    // Restore both panels before deciding which to show
    dom.svgInspector.hidden = !hasSvg;
    dom.rigInspector.hidden = !hasRig;

    if (!hasSvg || !hasRig) {
        dom.inspectorTabs.hidden = true;
        return;
    }

    dom.inspectorTabs.hidden = false;
    const active = state.activeInspectorTab;
    dom.inspectorTabs.querySelectorAll("[data-tab]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === active);
    });
    dom.svgInspector.hidden = active !== "svg";
    dom.rigInspector.hidden = active !== "rig";
}

function ensureSvgRig(sprite) {
    if (sprite.svgRig) return;

    const parts = [];
    
    // sprite.svgElement est l'ÃƒÂ©lÃƒÂ©ment SVG racine
    // Chercher le groupe principal (premier g[id] qui n'est pas PivotReference)
    let mainGroup = null;
    for (const child of sprite.svgElement.children) {
        if (child.tagName === "g" && child.id && !child.id.toLowerCase().includes("pivotreference")) {
            mainGroup = child;
            break;
        }
    }
    
    if (!mainGroup) {
        sprite.svgRig = { parts: [] };
        return;
    }
    
    // Parcourir la configuration du rig et chercher chaque partie dans le groupe principal
    for (const [partName, config] of Object.entries(RIG_CONFIG)) {
        const groupElement = findRigPartElement(mainGroup, partName, config);
        if (!groupElement) continue;
        const controls = getPartControls(config);
        const needsPivot = controls.some((control) => control.key === "rotation" || control.key.startsWith("scale"));

        let pivot = null;
        if (config.pivot) {
            const pivotElement = groupElement.querySelector(`circle#${config.pivot}, ellipse#${config.pivot}`);
            pivot = getPivotFromElement(pivotElement);
        }

        if (!pivot && needsPivot) {
            pivot = getSvgElementCenter(groupElement);
        }

        if (needsPivot && !pivot) continue;
        
        const part = {
            key: partName,
            id: partName,
            label: config.label,
            parentKey: config.parent || null,
            element: groupElement,
            baseTransform: groupElement.getAttribute("transform") || "",
            pivot,
            controls,
            pose: getDefaultPose(controls)
        };
        
        parts.push(part);
    }

    // Imbriquer les ÃƒÂ©lÃƒÂ©ments selon la hiÃƒÂ©rarchie SEULEMENT si on a des parties valides
    if (parts.length > 0) {
        nestRigElementsByHierarchy(mainGroup, parts);
    }

    sprite.svgRig = { parts };
}

function nestRigElementsByHierarchy(mainGroup, parts) {
    // Pour chaque partie avec un parent, dÃƒÂ©placer son ÃƒÂ©lÃƒÂ©ment enfant du parent
    const partsByKey = {};
    parts.forEach(p => { partsByKey[p.key] = p; });
    
    for (const part of parts) {
        if (part.parentKey) {
            const parent = partsByKey[part.parentKey];
            if (parent && parent.element && part.element) {
                // Si le parent contient dÃƒÂ©jÃƒÂ  cet enfant, ne rien faire
                if (!parent.element.contains(part.element)) {
                    // Retirer l'enfant de mainGroup et le mettre dans le parent
                    part.element.remove();
                    parent.element.appendChild(part.element);
                }
            }
        }
    }
}

function getPivotFromElement(element) {
    try {
        const cx = parseFloat(element.getAttribute("cx"));
        const cy = parseFloat(element.getAttribute("cy"));
        if (Number.isFinite(cx) && Number.isFinite(cy)) {
            return { x: cx, y: cy };
        }
        return null;
    } catch {
        return null;
    }
}

function isRigPartCandidate(element, svg) {
    if (element === svg) return false;
    if (element.id.toLowerCase().includes("pivotreference")) return false;
    if (element.closest("#PivotReference")) return false;

    return true;
}

function createRigPart(element, index) {
    const pivot = getSvgElementCenter(element);
    if (!pivot) return null;

    return {
        key: `part-${index}`,
        id: element.id,
        element,
        baseTransform: element.getAttribute("transform") || "",
        pivot,
        pose: {
            rotation: 0,
            x: 0,
            y: 0
        }
    };
}

function getSvgElementCenter(element) {
    try {
        const box = element.getBBox();
        if (!Number.isFinite(box.width) || !Number.isFinite(box.height)) return null;

        return {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2
        };
    } catch {
        return null;
    }
}

function createRigPartControls(part) {
    const item = document.createElement("details");
    const summary = document.createElement("summary");
    const controls = document.createElement("div");

    item.className = "rig-part";
    controls.className = "rig-part-controls";
    summary.textContent = part.label || part.id;

    part.controls.forEach((control) => {
        controls.appendChild(createRigSlider(part, control));
    });

    item.append(summary, controls);
    return item;
}

function createRigSlider(part, control) {
    const field = document.createElement("label");
    const header = document.createElement("span");
    const output = document.createElement("output");
    const input = document.createElement("input");

    field.className = "rig-slider";
    header.textContent = control.label;
    output.value = formatRigValue(part.pose[control.key], control.unit);

    input.type = "range";
    input.min = control.min;
    input.max = control.max;
    input.step = control.step;
    input.value = part.pose[control.key];
    input.dataset.rigPart = part.key;
    input.dataset.rigProperty = control.key;
    input.dataset.rigUnit = control.unit;

    field.append(header, output, input);
    return field;
}

function handleRigInspectorPointerDown(event) {
    const input = event.target.closest("[data-rig-part][data-rig-property], [data-rig-global]");
    if (!input || !state.selected?.svgRig) return;

    state.rigSliderActive = true;
    state._rigBeforeSnapshot = {
        transform: snapshotTransform(state.selected),
        rig: snapshotRigPose(state.selected)
    };
    dom.gizmo.hidden = true;
}

function handleRigInspectorPointerUp(event) {
    if (!state.rigSliderActive) return;
    state.rigSliderActive = false;
    if (state._rigBeforeSnapshot && state.selected) {
        const { transform, rig } = state._rigBeforeSnapshot;
        pushHistory(
            state.selected,
            transform, rig,
            snapshotTransform(state.selected),
            snapshotRigPose(state.selected)
        );
        state._rigBeforeSnapshot = null;
    }
    updateGizmo();
}

function handleRigInspectorInput(event) {
    const globalInput = event.target.closest("[data-rig-global]");
    if (globalInput && state.selected?.svgRig) {
        handleRigGlobalInput(globalInput);
        return;
    }

    const input = event.target.closest("[data-rig-part][data-rig-property]");
    if (!input || !state.selected?.svgRig) return;

    const part = state.selected.svgRig.parts.find((candidate) => candidate.key === input.dataset.rigPart);
    if (!part) return;

    part.pose[input.dataset.rigProperty] = Number(input.value);
    input.previousElementSibling.value = formatRigValue(part.pose[input.dataset.rigProperty], input.dataset.rigUnit || "px");

    // Appliquer la transform ÃƒÂ  cette partie ET ÃƒÂ  tous ses enfants
    applyRigPartTransformRecursive(part, state.selected.svgRig.parts);
    syncGlobalRigInputs();
}

function syncPartRigInputs(partKeys, property, value, unit) {
    partKeys.forEach((partKey) => {
        const input = dom.rigInspector.querySelector(`[data-rig-part='${partKey}'][data-rig-property='${property}']`);
        if (!input) return;
        input.value = value;
        if (input.previousElementSibling) {
            input.previousElementSibling.value = formatRigValue(value, unit);
        }
    });
}

function syncGlobalRigInputs() {
    if (!state.selected?.svgRig) return;

    const leftEye = findRigPart(state.selected, "LeftEye");
    const rightEye = findRigPart(state.selected, "RightEye");
    const eyesInput = dom.rigInspector.querySelector("[data-rig-global='eyesBlink']");
    if (eyesInput && leftEye && rightEye) {
        const eyesValue = (Number(leftEye.pose.scaleY) + Number(rightEye.pose.scaleY)) / 2;
        eyesInput.value = eyesValue;
        if (eyesInput.previousElementSibling) {
            eyesInput.previousElementSibling.value = formatRigValue(eyesValue, eyesInput.dataset.rigUnit || "x");
        }
    }

    const leftEyebrow = findRigPart(state.selected, "LeftEyebrow");
    const rightEyebrow = findRigPart(state.selected, "RightEyebrow");
    const eyebrowsInput = dom.rigInspector.querySelector("[data-rig-global='eyebrowsY']");
    if (eyebrowsInput && leftEyebrow && rightEyebrow) {
        const eyebrowsValue = (Number(leftEyebrow.pose.y) + Number(rightEyebrow.pose.y)) / 2;
        eyebrowsInput.value = eyebrowsValue;
        if (eyebrowsInput.previousElementSibling) {
            eyebrowsInput.previousElementSibling.value = formatRigValue(eyebrowsValue, eyebrowsInput.dataset.rigUnit || "px");
        }
    }
}

function handleRigGlobalInput(input) {
    const value = Number(input.value);
    const globalKey = input.dataset.rigGlobal;
    const sprite = state.selected;
    if (!sprite?.svgRig) return;

    if (globalKey === "eyesBlink") {
        const leftEye = findRigPart(sprite, "LeftEye");
        const rightEye = findRigPart(sprite, "RightEye");
        [leftEye, rightEye].forEach((part) => {
            if (!part) return;
            part.pose.scaleY = value;
            applyRigPartTransformRecursive(part, sprite.svgRig.parts);
        });
        syncPartRigInputs(["LeftEye", "RightEye"], "scaleY", value, input.dataset.rigUnit || "x");
    }

    if (globalKey === "eyebrowsY") {
        const leftEyebrow = findRigPart(sprite, "LeftEyebrow");
        const rightEyebrow = findRigPart(sprite, "RightEyebrow");
        [leftEyebrow, rightEyebrow].forEach((part) => {
            if (!part) return;
            part.pose.y = value;
            applyRigPartTransformRecursive(part, sprite.svgRig.parts);
        });
        syncPartRigInputs(["LeftEyebrow", "RightEyebrow"], "y", value, input.dataset.rigUnit || "px");
    }

    if (input.previousElementSibling) {
        input.previousElementSibling.value = formatRigValue(value, input.dataset.rigUnit || "px");
    }
}

function handleRigInspectorClick(event) {
    const resetButton = event.target.closest("[data-rig-action='reset']");
    if (!resetButton || !state.selected?.svgRig) return;

    state.selected.svgRig.parts.forEach((part) => {
        part.pose = getDefaultPose(part.controls || []);
    });

    // Appliquer les transforms ÃƒÂ  toutes les parties racine (sans parent)
    state.selected.svgRig.parts
        .filter(part => !part.parentKey)
        .forEach(part => applyRigPartTransformRecursive(part, state.selected.svgRig.parts));

    updateRigInspector();
}

function applyRigPartTransformRecursive(part, allParts) {
    // Appliquer la transform ÃƒÂ  cette partie
    applyRigPartTransform(part, allParts);
    
    // Trouver et appliquer ÃƒÂ  tous les enfants
    const children = allParts.filter(p => p.parentKey === part.key);
    children.forEach(child => applyRigPartTransformRecursive(child, allParts));
}

function getCompositeTransform(part, allParts) {
    // Avec l'imbricage DOM, on applique seulement la transformation de cette partie
    // SVG composera automatiquement avec les parents
    const rotation = Number(part.pose.rotation) || 0;
    const x = Number(part.pose.x) || 0;
    const y = Number(part.pose.y) || 0;
    const scaleX = Number(part.pose.scaleX);
    const scaleY = Number(part.pose.scaleY);
    let transforms = [];
    
    if (part.baseTransform) {
        transforms.push(part.baseTransform);
    }
    
    // Appliquer seulement la transformation de cette partie autour de son pivot
    if (x !== 0 || y !== 0) {
        transforms.push(`translate(${x} ${y})`);
    }

    if (rotation !== 0) {
        if (part.pivot) {
            transforms.push(`rotate(${rotation} ${part.pivot.x} ${part.pivot.y})`);
        } else {
            transforms.push(`rotate(${rotation})`);
        }
    }

    if (Number.isFinite(scaleX) || Number.isFinite(scaleY)) {
        const sx = Number.isFinite(scaleX) ? scaleX : 1;
        const sy = Number.isFinite(scaleY) ? scaleY : 1;
        if (part.pivot) {
            transforms.push(`translate(${part.pivot.x} ${part.pivot.y})`);
            transforms.push(`scale(${sx} ${sy})`);
            transforms.push(`translate(${-part.pivot.x} ${-part.pivot.y})`);
        } else {
            transforms.push(`scale(${sx} ${sy})`);
        }
    }
    
    return transforms.filter(Boolean).join(" ");
}

function applyRigPartTransform(part, allParts) {
    const transform = getCompositeTransform(part, allParts);
    part.element.setAttribute("transform", transform);
}

function formatRigValue(value, unit) {
    if (unit === "x") {
        return `${Number(value).toFixed(2)}${unit}`;
    }

    return `${Math.round(value)}${unit}`;
}

function updateSelectedFromInspector(property, value) {
    if (!state.selected) return;

    const number = parseFloat(value);
    if (!Number.isFinite(number)) return;

    state.selected.objectData[property] = property.startsWith("scale")
        ? (number < 0 ? Math.min(-SPRITE.minScale, number) : Math.max(SPRITE.minScale, number))
        : number;
    updateSprite(state.selected);
}

function resetSelectedRotation() {
    if (!state.selected) return;

    const before = snapshotTransform(state.selected);
    state.selected.objectData.rotation = 0;
    updateSprite(state.selected);
    pushHistory(state.selected, before, null, snapshotTransform(state.selected), null);
}

function resetSelectedScale() {
    if (!state.selected) return;

    const before = snapshotTransform(state.selected);
    state.selected.objectData.scaleX = 1;
    state.selected.objectData.scaleY = 1;
    updateSprite(state.selected);
    pushHistory(state.selected, before, null, snapshotTransform(state.selected), null);
}

function updateSelectedHidden() {
    if (!state.selected || state.selectedObjects.length > 1) return;

    state.selected.objectData.hidden = dom.hiddenInput.checked;
    updateSprite(state.selected);
}

function updateSprite(sprite) {
    const data = sprite.objectData;

    sprite.classList.toggle("object-hidden", Boolean(data.hidden));
    sprite.hierarchyItem?.classList.toggle("hierarchy-hidden", Boolean(data.hidden));
    sprite.style.left = `${data.x}px`;
    sprite.style.top = `${data.y}px`;
    sprite.style.transform = `rotate(${data.rotation}deg) scale(${data.scaleX}, ${data.scaleY})`;

    if (sprite === state.selected) {
        updateInspector();
        updateGizmo();
    }
}

function refreshSpriteLayout(sprite) {
    requestAnimationFrame(() => {
        if (!sprite.isConnected || !sprite.objectData) return;

        if (sprite === state.selected) {
            updateGizmo();
        }
    });
}

function handleSceneMouseDown(event) {
    if (event.target === dom.scene || event.target === dom.grid || event.target === dom.objectLayer) {
        if (event.button !== 0) return;
        const scenePos = screenToScene(event.clientX, event.clientY);
        state.interaction = {
            type: "box-select",
            axis: null,
            startSceneMouse: scenePos,
            startObjectPosition: null,
            startGroupPositions: null,
            groupCenter: null,
            lastMouse: null,
            beforeSnapshot: null,
            beforeRigSnapshot: null,
            boxStart: scenePos,
            boxCurrent: scenePos
        };
        dom.selectionBox.style.left = `${scenePos.x}px`;
        dom.selectionBox.style.top = `${scenePos.y}px`;
        dom.selectionBox.style.width = "0px";
        dom.selectionBox.style.height = "0px";
        dom.selectionBox.hidden = false;
    }
}

function handleViewportMouseDown(event) {
    if (event.button === 1) {
        event.preventDefault();
        state.interaction = {
            type: "pan",
            axis: null,
            startSceneMouse: null,
            startObjectPosition: null,
            lastMouse: getMousePosition(event)
        };
        return;
    }

    if (event.target === dom.viewport) {
        deselectAll();
    }
}

function handleViewportWheel(event) {
    event.preventDefault();

    const direction = event.deltaY < 0 ? 1 : -1;
    state.camera.zoom = clamp(
        state.camera.zoom + direction * VIEWPORT.zoomStep,
        VIEWPORT.minZoom,
        VIEWPORT.maxZoom
    );

    updateCamera();
}

function updateCamera() {
    dom.scene.style.width = `${VIEWPORT.sceneSize}px`;
    dom.scene.style.height = `${VIEWPORT.sceneSize}px`;
    dom.scene.style.transform = `translate(${state.camera.x}px, ${state.camera.y}px) scale(${state.camera.zoom})`;
}

function startSpriteMove(event, sprite) {
    if (event.button !== 0) return;

    event.stopPropagation();

    // If clicking a sprite already in a multi-selection, move the whole group
    if (state.selectedObjects.length > 1 && state.selectedObjects.includes(sprite)) {
        state.interaction = {
            type: "sprite-move",
            axis: null,
            startSceneMouse: screenToScene(event.clientX, event.clientY),
            startObjectPosition: null,
            startGroupPositions: state.selectedObjects.map((s) => ({
                sprite: s, x: s.objectData.x, y: s.objectData.y
            })),
            groupCenter: getGroupBounds(),
            lastMouse: null,
            beforeSnapshot: null,
            beforeRigSnapshot: null
        };
        return;
    }

    selectObject(sprite);

    state.interaction = {
        type: "sprite-move",
        axis: null,
        startSceneMouse: screenToScene(event.clientX, event.clientY),
        startObjectPosition: { x: sprite.objectData.x, y: sprite.objectData.y },
        startGroupPositions: null,
        groupCenter: null,
        lastMouse: null,
        beforeSnapshot: snapshotTransform(sprite),
        beforeRigSnapshot: snapshotRigPose(sprite)
    };
}

function startGizmoMove(event, axis) {
    if (event.button !== 0) return;
    if (!state.selected && state.selectedObjects.length === 0) return;

    event.stopPropagation();

    const isGroup = state.selectedObjects.length > 1;

    state.interaction = {
        type: "gizmo-move",
        axis,
        startSceneMouse: null,
        startObjectPosition: null,
        startGroupPositions: isGroup ? state.selectedObjects.map((s) => ({
            sprite: s, x: s.objectData.x, y: s.objectData.y
        })) : null,
        groupCenter: isGroup ? getGroupBounds() : null,
        lastMouse: getMousePosition(event),
        beforeSnapshot: isGroup ? null : snapshotTransform(state.selected),
        beforeRigSnapshot: null
    };
}

function startGizmoRotation(event) {
    if (event.button !== 0) return;
    if (!state.selected && state.selectedObjects.length === 0) return;

    event.stopPropagation();

    const isGroup = state.selectedObjects.length > 1;
    const bounds = isGroup ? getGroupBounds() : null;
    const center = isGroup
        ? sceneToScreen(bounds.cx, bounds.cy)
        : getSelectedCenterOnScreen();

    state.interaction = {
        type: "rotate",
        axis: null,
        startSceneMouse: null,
        startObjectPosition: {
            rotation: isGroup ? 0 : state.selected.objectData.rotation,
            angle: getAngle(center.x, center.y, event.clientX, event.clientY)
        },
        startGroupPositions: isGroup ? state.selectedObjects.map((s) => ({
            sprite: s,
            x: s.objectData.x, y: s.objectData.y,
            rotation: s.objectData.rotation
        })) : null,
        groupCenter: bounds,
        lastMouse: null,
        beforeSnapshot: isGroup ? null : snapshotTransform(state.selected),
        beforeRigSnapshot: null
    };
}

function startScale(event, handle) {
    if (event.button !== 0) return;
    if (!state.selected && state.selectedObjects.length === 0) return;

    event.stopPropagation();

    const isGroup = state.selectedObjects.length > 1;

    if (isGroup) {
        const bounds = getGroupBounds();
        state.interaction = {
            type: "scale",
            axis: handle,
            startSceneMouse: screenToScene(event.clientX, event.clientY),
            startObjectPosition: { scaleX: 1, scaleY: 1, width: bounds.width, height: bounds.height },
            startGroupPositions: state.selectedObjects.map((s) => ({
                sprite: s,
                x: s.objectData.x, y: s.objectData.y,
                scaleX: s.objectData.scaleX, scaleY: s.objectData.scaleY
            })),
            groupCenter: bounds,
            lastMouse: null,
            beforeSnapshot: null,
            beforeRigSnapshot: null
        };
        return;
    }

    const data = state.selected.objectData;
    state.interaction = {
        type: "scale",
        axis: handle,
        startSceneMouse: screenToScene(event.clientX, event.clientY),
        startObjectPosition: {
            scaleX: data.scaleX,
            scaleY: data.scaleY,
            width: state.selected.offsetWidth,
            height: state.selected.offsetHeight
        },
        startGroupPositions: null,
        groupCenter: null,
        lastMouse: null,
        beforeSnapshot: snapshotTransform(state.selected),
        beforeRigSnapshot: null
    };
}

function handleDocumentMouseMove(event) {
    const interaction = state.interaction;
    if (!interaction.type) return;

    if (interaction.type === "pan") {
        const mouse = getMousePosition(event);
        state.camera.x += mouse.x - interaction.lastMouse.x;
        state.camera.y += mouse.y - interaction.lastMouse.y;
        interaction.lastMouse = mouse;
        updateCamera();
        return;
    }

    if (interaction.type === "box-select") {
        const pos = screenToScene(event.clientX, event.clientY);
        interaction.boxCurrent = pos;
        const start = interaction.boxStart;
        const x = Math.min(start.x, pos.x);
        const y = Math.min(start.y, pos.y);
        const w = Math.abs(pos.x - start.x);
        const h = Math.abs(pos.y - start.y);
        dom.selectionBox.style.left = `${x}px`;
        dom.selectionBox.style.top = `${y}px`;
        dom.selectionBox.style.width = `${w}px`;
        dom.selectionBox.style.height = `${h}px`;
        return;
    }

    if (!state.selected && state.selectedObjects.length === 0) return;

    if (interaction.type === "sprite-move") {
        moveSelectedSprite(event);
    }

    if (interaction.type === "gizmo-move") {
        moveSelectedWithGizmo(event);
    }

    if (interaction.type === "rotate") {
        rotateSelected(event);
    }

    if (interaction.type === "scale") {
        scaleSelected(event);
    }
}

function moveSelectedSprite(event) {
    const mouse = screenToScene(event.clientX, event.clientY);
    const dx = mouse.x - state.interaction.startSceneMouse.x;
    const dy = mouse.y - state.interaction.startSceneMouse.y;

    if (state.interaction.startGroupPositions) {
        state.interaction.startGroupPositions.forEach(({ sprite, x, y }) => {
            sprite.objectData.x = x + dx;
            sprite.objectData.y = y + dy;
            updateSprite(sprite);
        });
        updateGroupGizmo();
        return;
    }

    state.selected.objectData.x = state.interaction.startObjectPosition.x + dx;
    state.selected.objectData.y = state.interaction.startObjectPosition.y + dy;
    updateSprite(state.selected);
}

function moveSelectedWithGizmo(event) {
    const mouse = getMousePosition(event);
    const dx = (mouse.x - state.interaction.lastMouse.x) / state.camera.zoom;
    const dy = (mouse.y - state.interaction.lastMouse.y) / state.camera.zoom;
    const axis = getGizmoAxis(state.interaction.axis);
    const projectedMovement = dx * axis.x + dy * axis.y;

    state.interaction.lastMouse = mouse;

    if (state.interaction.startGroupPositions) {
        state.selectedObjects.forEach((sprite) => {
            sprite.objectData.x += axis.x * projectedMovement;
            sprite.objectData.y += axis.y * projectedMovement;
            updateSprite(sprite);
        });
        updateGroupGizmo();
        return;
    }

    state.selected.objectData.x += axis.x * projectedMovement;
    state.selected.objectData.y += axis.y * projectedMovement;
    updateSprite(state.selected);
}

function rotateSelected(event) {
    if (state.interaction.startGroupPositions) {
        const gc = state.interaction.groupCenter;
        const centerScreen = sceneToScreen(gc.cx, gc.cy);
        const currentAngle = getAngle(centerScreen.x, centerScreen.y, event.clientX, event.clientY);
        const angleDelta = currentAngle - state.interaction.startObjectPosition.angle;
        const rad = degreesToRadians(angleDelta);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        state.interaction.startGroupPositions.forEach(({ sprite, x, y, rotation }) => {
            const w = sprite.offsetWidth;
            const h = sprite.offsetHeight;
            const dx = x + w / 2 - gc.cx;
            const dy = y + h / 2 - gc.cy;
            sprite.objectData.x = gc.cx + dx * cos - dy * sin - w / 2;
            sprite.objectData.y = gc.cy + dx * sin + dy * cos - h / 2;
            sprite.objectData.rotation = rotation + angleDelta;
            updateSprite(sprite);
        });
        updateGroupGizmo();
        return;
    }

    const center = getSelectedCenterOnScreen();
    const currentAngle = getAngle(center.x, center.y, event.clientX, event.clientY);
    const { angle, rotation } = state.interaction.startObjectPosition;

    state.selected.objectData.rotation = rotation + currentAngle - angle;
    updateSprite(state.selected);
}

function scaleSelected(event) {
    if (state.interaction.startGroupPositions) {
        const mouse = screenToScene(event.clientX, event.clientY);
        const start = state.interaction.startSceneMouse;
        const { width, height } = state.interaction.startObjectPosition;
        const handle = state.interaction.axis;
        const gc = state.interaction.groupCenter;

        let factorX = 1, factorY = 1;
        if (handle.includes("e") || handle.includes("w")) {
            const dir = handle.includes("e") ? 1 : -1;
            factorX = 1 + dir * ((mouse.x - start.x) * 2) / (width || 1);
        }
        if (handle.includes("n") || handle.includes("s")) {
            const dir = handle.includes("s") ? 1 : -1;
            factorY = 1 + dir * ((mouse.y - start.y) * 2) / (height || 1);
        }
        if (event.shiftKey) {
            const factor = Math.abs(factorX - 1) >= Math.abs(factorY - 1) ? factorX : factorY;
            factorX = factorY = factor;
        }

        state.interaction.startGroupPositions.forEach(({ sprite, x, y, scaleX, scaleY }) => {
            const w = sprite.offsetWidth;
            const h = sprite.offsetHeight;
            const cx = x + w / 2 - gc.cx;
            const cy = y + h / 2 - gc.cy;
            sprite.objectData.x = gc.cx + cx * factorX - w / 2;
            sprite.objectData.y = gc.cy + cy * factorY - h / 2;
            sprite.objectData.scaleX = Math.max(SPRITE.minScale, Math.abs(scaleX * factorX));
            sprite.objectData.scaleY = Math.max(SPRITE.minScale, Math.abs(scaleY * factorY));
            updateSprite(sprite);
        });
        updateGroupGizmo();
        return;
    }

    const mouse = screenToScene(event.clientX, event.clientY);
    const start = state.interaction.startSceneMouse;
    const data = state.selected.objectData;
    const { scaleX, scaleY, width, height } = state.interaction.startObjectPosition;
    const localMovement = getLocalMovement(
        mouse.x - start.x,
        mouse.y - start.y,
        data.rotation
    );
    const handle = state.interaction.axis;

    if (event.shiftKey) {
        scaleSelectedUniformly(handle, localMovement, width, height, scaleX, scaleY);
        updateSprite(state.selected);
        return;
    }

    if (handle.includes("e") || handle.includes("w")) {
        const direction = handle.includes("e") ? 1 : -1;
        const nextScaleX = scaleX + direction * (localMovement.x * 2) / width;
        data.scaleX = Math.max(SPRITE.minScale, nextScaleX);
    }

    if (handle.includes("s") || handle.includes("n")) {
        const direction = handle.includes("s") ? 1 : -1;
        const nextScaleY = scaleY + direction * (localMovement.y * 2) / height;
        data.scaleY = Math.max(SPRITE.minScale, nextScaleY);
    }

    updateSprite(state.selected);
}

function scaleSelectedUniformly(handle, localMovement, width, height, scaleX, scaleY) {
    const data = state.selected.objectData;
    const xFactor = getScaleFactorFromHandleAxis(
        handle,
        "x",
        localMovement.x,
        width,
        scaleX
    );
    const yFactor = getScaleFactorFromHandleAxis(
        handle,
        "y",
        localMovement.y,
        height,
        scaleY
    );
    const factor = chooseUniformScaleFactor(handle, xFactor, yFactor);

    data.scaleX = Math.max(SPRITE.minScale, scaleX * factor);
    data.scaleY = Math.max(SPRITE.minScale, scaleY * factor);
}

function getScaleFactorFromHandleAxis(handle, axis, movement, size, startScale) {
    const negativeHandle = axis === "x" ? "w" : "n";
    const positiveHandle = axis === "x" ? "e" : "s";

    if (!handle.includes(negativeHandle) && !handle.includes(positiveHandle)) {
        return null;
    }

    const direction = handle.includes(positiveHandle) ? 1 : -1;
    const nextScale = startScale + direction * (movement * 2) / size;

    return nextScale / startScale;
}

function chooseUniformScaleFactor(handle, xFactor, yFactor) {
    if (xFactor === null) return yFactor;
    if (yFactor === null) return xFactor;

    return Math.abs(xFactor - 1) >= Math.abs(yFactor - 1)
        ? xFactor
        : yFactor;
}

function stopInteraction() {
    const { type, beforeSnapshot, beforeRigSnapshot, boxStart, boxCurrent } = state.interaction;

    state.interaction = {
        type: null,
        axis: null,
        startSceneMouse: null,
        startObjectPosition: null,
        startGroupPositions: null,
        groupCenter: null,
        lastMouse: null,
        beforeSnapshot: null,
        beforeRigSnapshot: null
    };

    dom.selectionBox.hidden = true;

    if (type === "box-select") {
        finishBoxSelection(boxStart, boxCurrent);
        return;
    }

    if (beforeSnapshot && state.selected) {
        pushHistory(
            state.selected,
            beforeSnapshot,
            beforeRigSnapshot,
            snapshotTransform(state.selected),
            snapshotRigPose(state.selected)
        );
    }
}

function snapshotTransform(sprite) {
    const { x, y, rotation, scaleX, scaleY } = sprite.objectData;
    return { x, y, rotation, scaleX, scaleY };
}

function snapshotRigPose(sprite) {
    if (!sprite?.svgRig?.parts) return null;
    return sprite.svgRig.parts.map(p => ({ key: p.key, pose: { ...p.pose } }));
}

function snapshotSvgColors(sprite) {
    if (!sprite?.svgStyles) return null;
    return sprite.svgStyles.map(s => ({ scopedClassName: s.scopedClassName, color: s.color, alpha: s.alpha ?? 1 }));
}

function pushColorHistory(sprite, beforeColors, afterColors) {
    if (!beforeColors || !afterColors) return;
    if (JSON.stringify(beforeColors) === JSON.stringify(afterColors)) return;
    state.history.splice(state.historyIndex + 1);
    state.history.push({ sprite, beforeColors, afterColors });
    if (state.history.length > 50) state.history.shift();
    state.historyIndex = state.history.length - 1;
}

function pushHistory(sprite, before, beforeRig, after, afterRig) {
    const transformUnchanged =
        before.x === after.x && before.y === after.y &&
        before.rotation === after.rotation &&
        before.scaleX === after.scaleX && before.scaleY === after.scaleY;
    const rigUnchanged = !beforeRig || !afterRig ||
        JSON.stringify(beforeRig) === JSON.stringify(afterRig);
    if (transformUnchanged && rigUnchanged) return;

    state.history.splice(state.historyIndex + 1);
    state.history.push({ sprite, before, beforeRig, after, afterRig });
    if (state.history.length > 50) state.history.shift();
    state.historyIndex = state.history.length - 1;
}

function undo() {
    if (state.historyIndex < 0) return;
    const entry = state.history[state.historyIndex--];

    if (entry.beforeColors) {
        entry.beforeColors.forEach(({ scopedClassName, color, alpha }) => {
            updateSvgClassColor(entry.sprite, scopedClassName, color, alpha);
        });
        if (state.selected === entry.sprite) {
            updateSvgInspector();
            syncInspectorTabs();
        }
        return;
    }

    Object.assign(entry.sprite.objectData, entry.before);

    if (entry.beforeRig && entry.sprite.svgRig) {
        entry.beforeRig.forEach(({ key, pose }) => {
            const part = entry.sprite.svgRig.parts.find(p => p.key === key);
            if (part) Object.assign(part.pose, pose);
        });
        entry.sprite.svgRig.parts.forEach(p =>
            applyRigPartTransformRecursive(p, entry.sprite.svgRig.parts)
        );
    }

    updateSprite(entry.sprite);

    if (state.selected === entry.sprite) {
        updateInspector();
        updateGizmo();
        if (entry.beforeRig) {
            updateRigInspector();
            syncInspectorTabs();
        }
    }
}

function updateGizmo() {
    if (state.selectedObjects.length > 1) {
        updateGroupGizmo();
        return;
    }

    const sprite = state.selected;
    if (!sprite) {
        dom.gizmo.hidden = true;
        return;
    }

    const { x, y, rotation } = sprite.objectData;
    const bounds = getScaledSpriteBounds(sprite);
    const gizmoRotation = state.transformSpace === "local" ? rotation : 0;
    const unscaledWidth = bounds.width / sprite.objectData.scaleX;
    const unscaledHeight = bounds.height / sprite.objectData.scaleY;

    dom.gizmo.hidden = false;
    dom.gizmo.style.left = `${x + unscaledWidth / 2}px`;
    dom.gizmo.style.top = `${y + unscaledHeight / 2}px`;
    dom.gizmo.style.transform = `rotate(${gizmoRotation}deg)`;
    dom.scaleFrame.style.setProperty("--selection-width", `${bounds.width}px`);
    dom.scaleFrame.style.setProperty("--selection-height", `${bounds.height}px`);
    dom.scaleFrame.style.transform = `rotate(${rotation - gizmoRotation}deg)`;
}

function getGizmoAxis(axisName) {
    const angle = (state.selectedObjects.length <= 1 && state.selected && state.transformSpace === "local")
        ? degreesToRadians(state.selected.objectData.rotation)
        : 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return axisName === "x"
        ? { x: cos, y: sin }
        : { x: -sin, y: cos };
}

function getScaledSpriteBounds(sprite) {
    const data = sprite.objectData;
    const fallbackRect = sprite.getBoundingClientRect();
    const width = sprite.offsetWidth || fallbackRect.width / state.camera.zoom || SPRITE.defaultWidth;
    const height = sprite.offsetHeight || fallbackRect.height / state.camera.zoom || SPRITE.defaultWidth;

    return {
        width: width * data.scaleX,
        height: height * data.scaleY
    };
}

function getLocalMovement(dx, dy, rotation) {
    const angle = degreesToRadians(rotation);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
        x: dx * cos + dy * sin,
        y: -dx * sin + dy * cos
    };
}

function toggleTransformSpace() {
    setTransformSpace(state.transformSpace === "local" ? "world" : "local");
}

function setTransformSpace(mode) {
    state.transformSpace = mode;
    dom.spaceToggle.textContent = `Space: ${mode.toUpperCase()}`;
    updateGizmo();
}

function deleteSelectedObject() {
    if (state.selectedObjects.length > 1) {
        const toDelete = [...state.selectedObjects];
        toDelete.forEach((sprite) => {
            sprite.remove();
            sprite.hierarchyItem?.remove();
        });
        state.objects = state.objects.filter((obj) => !toDelete.includes(obj));
        state.contextTarget = toDelete.includes(state.contextTarget) ? null : state.contextTarget;
        state.selected = null;
        state.selectedObjects = [];
        updateInspector({ refreshSvg: true });
        updateGizmo();
        return;
    }

    const sprite = state.selected;
    if (!sprite) return;

    sprite.remove();
    sprite.hierarchyItem?.remove();
    state.objects = state.objects.filter((object) => object !== sprite);
    state.contextTarget = state.contextTarget === sprite ? null : state.contextTarget;
    state.selected = null;

    updateInspector({ refreshSvg: true });
    updateGizmo();
}

function handleDocumentKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        const active = document.activeElement;
        if (!active?.matches("input, textarea")) {
            event.preventDefault();
            undo();
            return;
        }
    }

    if (event.key === "Escape") {
        closeContextMenu();
        stopInteraction();
        return;
    }

    if (event.key !== "Delete" || state.selectedObjects.length === 0) return;

    const activeElement = document.activeElement;
    const isEditingText = activeElement?.matches("input, textarea");
    if (isEditingText) return;

    if (confirm("Supprimer cet objet ?")) {
        deleteSelectedObject();
    }
}

function getSelectedCenterOnScreen() {
    const rect = state.selected.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

function screenToScene(clientX, clientY) {
    const rect = dom.scene.getBoundingClientRect();
    return {
        x: (clientX - rect.left) / state.camera.zoom,
        y: (clientY - rect.top) / state.camera.zoom
    };
}

function getMousePosition(event) {
    return {
        x: event.clientX,
        y: event.clientY
    };
}

function getAngle(cx, cy, mx, my) {
    return Math.atan2(my - cy, mx - cx) * 180 / Math.PI;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatScale(value) {
    return Number.parseFloat(value.toFixed(2)).toString();
}

function normalizeHexColor(value) {
    if (!value) return null;

    const color = value.trim();
    const shortHex = color.match(/^#([0-9a-f]{3})$/i);
    const longHex = color.match(/^#([0-9a-f]{6})$/i);

    if (longHex) return `#${longHex[1].toUpperCase()}`;

    if (shortHex) {
        return `#${shortHex[1]
            .split("")
            .map((character) => character + character)
            .join("")
            .toUpperCase()}`;
    }

    return null;
}

function normalizeAlphaValue(value) {
    if (value == null || value === "") return null;
    const numeric = Number.parseFloat(String(value).trim());
    if (!Number.isFinite(numeric)) return null;
    return clamp(numeric, 0, 1);
}

function formatSvgAlpha(value) {
    return (normalizeAlphaValue(value) ?? 1).toFixed(2);
}

function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value);
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sceneToScreen(sceneX, sceneY) {
    const rect = dom.scene.getBoundingClientRect();
    return {
        x: rect.left + sceneX * state.camera.zoom,
        y: rect.top + sceneY * state.camera.zoom
    };
}

function selectMultiple(sprites) {
    if (sprites.length === 0) { deselectAll(); return; }
    if (sprites.length === 1) { selectObject(sprites[0]); return; }

    stopInteraction();
    state.selected = null;
    state.selectedObjects = sprites;

    state.objects.forEach((obj) => {
        const isSelected = sprites.includes(obj);
        obj.classList.toggle("selected", isSelected);
        obj.hierarchyItem?.classList.toggle("hierarchy-selected", isSelected);
    });

    updateInspector({ refreshSvg: true });
    updateGizmo();
}

function updateGroupGizmo() {
    const bounds = getGroupBounds();
    if (!bounds) { dom.gizmo.hidden = true; return; }

    dom.gizmo.hidden = false;
    dom.gizmo.style.left = `${bounds.cx}px`;
    dom.gizmo.style.top = `${bounds.cy}px`;
    dom.gizmo.style.transform = "rotate(0deg)";
    dom.scaleFrame.style.setProperty("--selection-width", `${bounds.width}px`);
    dom.scaleFrame.style.setProperty("--selection-height", `${bounds.height}px`);
    dom.scaleFrame.style.transform = "rotate(0deg)";
}

function getGroupBounds() {
    if (state.selectedObjects.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    state.selectedObjects.forEach((sprite) => {
        const b = getSpriteBoundsInScene(sprite);
        minX = Math.min(minX, b.left);
        minY = Math.min(minY, b.top);
        maxX = Math.max(maxX, b.right);
        maxY = Math.max(maxY, b.bottom);
    });

    return {
        x: minX, y: minY,
        width: maxX - minX, height: maxY - minY,
        cx: (minX + maxX) / 2, cy: (minY + maxY) / 2
    };
}

function getSpriteBoundsInScene(sprite) {
    const rect = sprite.getBoundingClientRect();
    const tl = screenToScene(rect.left, rect.top);
    const br = screenToScene(rect.right, rect.bottom);
    return {
        left: Math.min(tl.x, br.x), top: Math.min(tl.y, br.y),
        right: Math.max(tl.x, br.x), bottom: Math.max(tl.y, br.y)
    };
}

function finishBoxSelection(boxStart, boxCurrent) {
    if (!boxStart || !boxCurrent) { deselectAll(); return; }

    const dx = Math.abs(boxCurrent.x - boxStart.x);
    const dy = Math.abs(boxCurrent.y - boxStart.y);
    if (dx < 3 && dy < 3) { deselectAll(); return; }

    const boxLeft = Math.min(boxStart.x, boxCurrent.x);
    const boxTop = Math.min(boxStart.y, boxCurrent.y);
    const boxRight = Math.max(boxStart.x, boxCurrent.x);
    const boxBottom = Math.max(boxStart.y, boxCurrent.y);

    const selected = state.objects.filter((sprite) => {
        const b = getSpriteBoundsInScene(sprite);
        return b.right > boxLeft && b.left < boxRight && b.bottom > boxTop && b.top < boxBottom;
    });

    selectMultiple(selected);
}

/* Local exports: jsPDF 3.0.3 (MIT), SheetJS CE 0.20.3 (Apache-2.0). */
window.URPSResultsExport = (() => {
  const filename = "resultats_urps_obesite";
  const recipient = "vincent.reynaert@univ-catholille.fr";
  const clean = value => String(value ?? "").replace(/<[^>]*>/g, "").replace(/\u202f|\u00a0/g, " ").replace(/œ/g, "oe").replace(/Œ/g, "OE");

  function pdf(payload, paletteFor) {
    const doc = new window.jspdf.jsPDF();
    let y = 20;
    const next = () => { doc.addPage(); y = 20; };
    const room = height => { if (y + height > 278) next(); };
    function text(value, size = 11, bold = false) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor("#243447");
      for (const line of doc.splitTextToSize(clean(value), 174)) {
        room(size * .45);
        doc.text(line, 18, y);
        y += size * .45;
      }
      y += 3;
    }
    function gauge(value, color, max = 100) {
      room(16);
      const valid = Number.isFinite(value) && Number.isFinite(max) && max > 0;
      doc.setFillColor("#e8edf2");
      doc.roundedRect(18, y, 135, 5, 2, 2, "F");
      if (valid && value > 0) {
        doc.setFillColor(color);
        doc.rect(18, y, 135 * Math.min(1, Math.max(0, value / max)), 5, "F");
      }
      doc.setFontSize(10);
      doc.text(valid ? `${Number(value.toFixed(2))} / ${max}` : "Non scoré", 158, y + 4);
      y += 14;
    }
    text("Mon bilan — URPS Obésité", 22, true);
    text("Synthèse des réponses et pistes de réflexion", 12);
    text("Les jauges reprennent les scores corrigés du questionnaire.", 10);

    // Draw a vector radar with labels; the on-screen labels are separate HTML post-its.
    const scores = payload.scores;
    const cx = 105, cy = 123, radius = 49;
    const point = (i, ratio) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / scores.length;
      return [cx + Math.cos(a) * radius * ratio, cy + Math.sin(a) * radius * ratio];
    };
    for (let ring = 1; ring <= 5; ring++) {
      doc.setDrawColor("#d2dae4");
      scores.forEach((s, i) => doc.line(...point(i, ring / 5), ...point((i + 1) % scores.length, ring / 5)));
    }
    scores.forEach((s, i) => {
      const p = point(i, 1);
      doc.line(cx, cy, ...p);
      const label = point(i, 1.34);
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(clean(s.label), 48), label[0], label[1], { align: "center" });
    });
    doc.setDrawColor("#387eb5");
    doc.setLineWidth(.8);
    scores.forEach((s, i) => {
      const ratio = v => Number.isFinite(v) ? Math.max(0, Math.min(100, v)) / 100 : 0;
      const p = point(i, ratio(s.score));
      doc.line(...p, ...point((i + 1) % scores.length, ratio(scores[(i + 1) % scores.length].score)));
      doc.setFillColor(paletteFor(s.key).color);
      doc.circle(...p, 1.8, "F");
    });
    doc.setLineWidth(.2);
    y = 212;
    text("Échelle du diagramme : 0 à 100 (20 points par graduation).", 10);
    scores.forEach(category => {
      next();
      const palette = paletteFor(category.key);
      text(category.label, 19, true);
      gauge(category.count === 0 ? null : category.score, palette.color);
      const details = payload.details?.[category.key] || [];
      if (!details.length) text("Aucune réponse enregistrée pour cette catégorie.");
      details.forEach((detail, index) => {
        room(45);
        text(`${index + 1}. ${detail.question || detail.feedbackTitle || "Question non conservée"}`, 12, true);
        text(`Réponse : ${detail.answer ?? "Non renseignée"}`);
        gauge(detail.numericValue, palette.color, detail.scoreMax || 5);
        if (detail.feedbackTitle) text(detail.feedbackTitle, 11, true);
        text(detail.feedback || "Aucun retour disponible.");
        y += 6;
      });
    });
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor("#677585");
      doc.text(`URPS Obésité • ${i} / ${pages}`, 105, 289, { align: "center" });
    }
    doc.save(`${filename}.pdf`);
  }

  function workbookFor(rows) {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 85 }, { wch: 60 }, { wch: 28 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, sheet, "Résultats");
    return workbook;
  }

  function excel(rows) {
    XLSX.writeFile(workbookFor(rows), `${filename}.xlsx`, { compression: true });
  }

  async function shareExcel(rows) {
    const file = new File([XLSX.write(workbookFor(rows), { bookType: "xlsx", type: "array", compression: true })],
      `${filename}.xlsx`, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({ files: [file], title: "Résultats URPS Obésité",
          text: `Résultats URPS Obésité à envoyer à ${recipient}` });
        return "shared";
      } catch (error) {
        // Dismissing the share sheet must not trigger an unexpected download.
        if (error.name === "AbortError") return "cancelled";
      }
    }
    excel(rows);
    return "downloaded";
  }

  function mailUrl() {
    const body = `Bonjour,\n\nVous trouverez en pièce jointe mes résultats au questionnaire URPS Obésité.\n\nVeuillez joindre le fichier ${filename}.xlsx téléchargé avant d’envoyer ce message.\n\nCordialement`;
    return `mailto:${recipient}?subject=${encodeURIComponent("Résultats URPS Obésité")}&body=${encodeURIComponent(body)}`;
  }
  return { pdf, excel, shareExcel, mailUrl };
})();

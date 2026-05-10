import { jsPDF } from "jspdf";

export interface SimParams {
  trafficMod: number;
  weatherIndex: number;
}

export interface SimResults {
  congestion: number;
  arteries: string[];
  etaImpact: string;
  savedAt: string;
}

export function exportSimPDF(params: SimParams, results: SimResults): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const ts = new Date(results.savedAt);
  const tsStr = ts.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const filename = `vayugati-sim-${Date.now()}.pdf`;

  // ── Header block ────────────────────────────────────────────────
  doc.setFillColor(15, 15, 20); // near-black
  doc.rect(0, 0, W, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("VAYU-GATI", 14, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 180);
  doc.text("Smart City Digital Twin — Simulation Export", 14, 23);

  doc.setTextColor(100, 100, 120);
  doc.setFontSize(7);
  doc.text(`Generated: ${tsStr}`, 14, 30);

  // Right: logo dot
  doc.setFillColor(79, 70, 229);
  doc.circle(W - 20, 18, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("V", W - 23, 22);

  // ── Title ───────────────────────────────────────────────────────
  let y = 46;
  doc.setTextColor(20, 20, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Simulation Report", 14, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 110);
  doc.text("What-If Model · Manual Parameter Run", 14, y);

  // Divider
  y += 8;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y);

  // ── Parameters section ──────────────────────────────────────────
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // indigo
  doc.text("INPUT PARAMETERS", 14, y);

  y += 7;
  const paramRows: [string, string][] = [
    ["Traffic Volume Modifier", `${params.trafficMod > 0 ? "+" : ""}${params.trafficMod}%`],
    ["Weather Impact Index", `${params.weatherIndex.toFixed(1)} / 10`],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const [label, value] of paramRows) {
    doc.setTextColor(80, 80, 95);
    doc.text(label, 14, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 30);
    doc.text(value, 110, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  }

  // ── Results section ─────────────────────────────────────────────
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text("SIMULATION RESULTS", 14, y);

  y += 8;

  // Result cards (3-up)
  const cards: { label: string; value: string; color: [number, number, number] }[] = [
    {
      label: "Predicted Congestion",
      value: `${results.congestion}%`,
      color: results.congestion > 70 ? [239, 68, 68] : results.congestion > 40 ? [249, 115, 22] : [34, 197, 94],
    },
    {
      label: "Arteries Affected",
      value: `${results.arteries.length}`,
      color: [249, 115, 22],
    },
    {
      label: "ETA Impact",
      value: results.etaImpact,
      color: [239, 68, 68],
    },
  ];

  const cardW = (W - 28 - 8) / 3;
  let cx = 14;
  for (const card of cards) {
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(cx, y, cardW, 28, 3, 3, "F");
    doc.setDrawColor(...card.color);
    doc.setLineWidth(0.4);
    doc.roundedRect(cx, y, cardW, 28, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...card.color);
    doc.text(card.value, cx + cardW / 2, y + 14, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 110);
    doc.text(card.label.toUpperCase(), cx + cardW / 2, y + 22, { align: "center" });

    cx += cardW + 4;
  }

  y += 36;

  // Affected arteries detail
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 95);
  doc.text("Affected Arteries:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 30);
  doc.text(results.arteries.join("  ·  "), 60, y);

  // ── Footer ──────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(245, 245, 250);
  doc.rect(0, pageH - 14, W, 14, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 155);
  doc.text("Vayu-Gati Smart City Digital Twin  |  Confidential Simulation Output", 14, pageH - 5);
  doc.text(`Page 1 of 1`, W - 14, pageH - 5, { align: "right" });

  doc.save(filename);
}

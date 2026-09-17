(() => {
  "use strict";
  console.log("[admin.js] loaded, readyState:", document.readyState);

  const CONFIG = window.CHECKLIST_APP_CONFIG || {};
  let records = [];
  let adminPin = "";
  let currentRecord = null;
  let approveAuth = { pin: "", token: "" };
  let signPad = null;
  let approveTarget = null;
  let initialized = false;
  const $ = selector => document.querySelector(selector);

  // readyState-safe init: jalan baik script dimuat sebelum atau setelah DCL
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM sudah siap (defer + browser lambat, atau script di-load ulang)
    init();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    console.log("[admin.js] init()");

    const bind = (selector, event, handler) => {
      const el = $(selector);
      if (!el) {
        console.warn("[admin.js] element not found:", selector);
        return;
      }
      el.addEventListener(event, handler);
    };

    bind("#loginButton", "click", login);
    bind("#adminPin", "keydown", event => { if (event.key === "Enter") login(); });
    bind("#refreshButton", "click", loadRecords);
    bind("#searchInput", "input", render);
    bind("#typeFilter", "change", render);
    bind("#statusFilter", "change", render);
    bind("#approvalFilter", "change", render);
    bind("#csvButton", "click", exportCsv);

    bind("#recordBody", "click", event => {
      const detailBtn = event.target.closest("[data-detail-id]");
      if (detailBtn) { showDetail(detailBtn.dataset.detailId); return; }
      const approveBtn = event.target.closest("[data-approve-id]");
      if (approveBtn) { openApprovalById(approveBtn.dataset.approveId); return; }
      const pdfBtn = event.target.closest("[data-pdf-id]");
      if (pdfBtn) { regeneratePdf(pdfBtn.dataset.pdfId); }
    });

    bind("#closeDetailButton", "click", () => { const d = $("#detailDialog"); if (d) d.close(); });
    bind("#closeApproveButton", "click", () => { const d = $("#approveDialog"); if (d) d.close(); });
    bind("#clearApproveSignature", "click", () => signPad && signPad.clear());
    bind("#approveButton", "click", () => submitApproval("approve"));
    bind("#rejectButton", "click", () => submitApproval("reject"));

    try {
      setupSignPad();
    } catch (e) {
      console.error("[admin.js] setupSignPad failed:", e);
    }

    // Deep link: ?approve=<id>&type=opening|closing&token=<optional>
    try {
      const params = new URLSearchParams(location.search);
      const approveId = params.get("approve");
      const type = params.get("type");
      const token = params.get("token");
      if (approveId && type) {
        approveAuth.token = token || "";
        approveTarget = { id: approveId, type: type };
        const loginPanel = $("#loginPanel");
        const recordsPanel = $("#recordsPanel");
        if (loginPanel) loginPanel.hidden = false;
        if (recordsPanel) recordsPanel.hidden = true;
        const loginHeading = $("#loginPanel .section-heading h2");
        if (loginHeading) loginHeading.textContent = "Masukkan PIN untuk approval";
        setTimeout(() => { const f = $("#adminPin"); if (f) f.focus(); }, 200);
      }
    } catch (e) {
      console.warn("[admin.js] URL param parse failed:", e);
    }
  }

  // ============ AUTH ============
  async function login() {
    adminPin = ($("#adminPin").value || "").trim();
    if (!adminPin) return toast("PIN admin wajib diisi.", "error");
    approveAuth.pin = adminPin;
    console.log("[admin.js] login with PIN length:", adminPin.length);

    if (approveTarget) {
      const target = approveTarget;
      approveTarget = null;
      await loadSingleForApproval(target.id, target.type);
      return;
    }
    await loadRecords();
  }

  // ============ LIST ============
  async function loadRecords() {
    if (!CONFIG.apiUrl || CONFIG.apiUrl.includes("PASTE_YOUR")) {
      return toast("URL Apps Script belum diatur di config.js.", "error");
    }
    setBusy(true);
    try {
      console.log("[admin.js] loadRecords: calling API");
      const result = await apiCall({ action: "list", adminPin, limit: 500 });
      console.log("[admin.js] loadRecords response ok:", result && result.ok);
      if (!result.ok) throw new Error(result.message || "Gagal memuat data.");
      records = result.records || [];
      const loginPanel = $("#loginPanel");
      const recordsPanel = $("#recordsPanel");
      if (loginPanel) loginPanel.hidden = true;
      if (recordsPanel) recordsPanel.hidden = false;
      render();
      toast("Riwayat berhasil dimuat.", "success");
    } catch (error) {
      console.error("[admin.js] loadRecords error:", error);
      toast(error.message, "error");
    }
    finally { setBusy(false); }
  }

  async function loadSingleForApproval(id, type) {
    setBusy(true);
    try {
      const result = await apiCall({
        action: "get",
        checklistType: type,
        submissionId: id,
        adminPin: approveAuth.pin
      });
      if (!result.ok) throw new Error(result.message || "Gagal memuat data.");
      records = [result.record];
      const loginPanel = $("#loginPanel");
      const recordsPanel = $("#recordsPanel");
      if (loginPanel) loginPanel.hidden = true;
      if (recordsPanel) recordsPanel.hidden = true;
      openApprovalDialog(result.record);
    } catch (error) {
      console.error("[admin.js] loadSingleForApproval error:", error);
      toast(error.message, "error");
    }
    finally { setBusy(false); }
  }

  async function apiCall(body) {
    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow"
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  // ============ FILTER + RENDER LIST ============
  function filteredRecords() {
    const query = ($("#searchInput").value || "").trim().toLowerCase();
    const type = $("#typeFilter").value;
    const status = $("#statusFilter").value;
    const approval = $("#approvalFilter").value;
    return records.filter(record => {
      const haystack = [record.submissionId, record.executionDate, record.picName, record.store, record.formLabel]
        .join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (!type || record.checklistType === type)
        && (!status || (record.summary && record.summary.overallStatus) === status)
        && (!approval || record.approvalStatus === approval);
    });
  }

  function render() {
    const rows = filteredRecords();
    const countEl = $("#recordCount");
    if (countEl) countEl.textContent = `${rows.length} checklist`;
    const emptyEl = $("#emptyState");
    if (emptyEl) emptyEl.hidden = rows.length > 0;

    const bodyEl = $("#recordBody");
    if (!bodyEl) return;

    bodyEl.innerHTML = rows.map(record => {
      const status = (record.summary && record.summary.overallStatus) || "-";
      const statusClass = status === "SELESAI" ? "status-ok" : "status-issue";
      const typeClass = record.checklistType === "closing"
        ? "type-badge type-badge--closing"
        : "type-badge type-badge--opening";
      const approval = record.approvalStatus || "APPROVED";
      const approvalBadge = renderApprovalBadge(approval);
      const canApprove = approval === "PENDING_APPROVAL";
      const canPdf = approval === "APPROVED";
      return `<tr>
        <td><span class="${typeClass}">${escapeHtml(record.formLabel || "-")}</span></td>
        <td>${escapeHtml(record.submissionId || "-")}</td>
        <td>${escapeHtml(formatDate(record.executionDate))}</td>
        <td>${escapeHtml(record.executionTime || "-")}</td>
        <td>${escapeHtml(record.picName || "-")}</td>
        <td class="${statusClass}">${escapeHtml(status)}</td>
        <td>${approvalBadge}</td>
        <td>${Number((record.summary && record.summary.yes) || 0)}</td>
        <td>${Number((record.summary && record.summary.no) || 0)}</td>
        <td>${escapeHtml(formatDateTime(record.submittedAt))}</td>
        <td class="action-cell">
          <button class="button button--secondary button--small" data-detail-id="${escapeHtml(record.submissionId || "")}">Detail</button>
          ${canApprove ? `<button class="button button--primary button--small" data-approve-id="${escapeHtml(record.submissionId || "")}">Approve</button>` : ""}
          ${canPdf ? `<button class="button button--ghost button--small" data-pdf-id="${escapeHtml(record.submissionId || "")}">PDF</button>` : ""}
        </td>
      </tr>`;
    }).join("");
  }

  function renderApprovalBadge(status) {
    if (status === "PENDING_APPROVAL") return `<span class="approval-badge approval-badge--pending">Menunggu</span>`;
    if (status === "REJECTED") return `<span class="approval-badge approval-badge--rejected">Ditolak</span>`;
    return `<span class="approval-badge approval-badge--approved">Disetujui</span>`;
  }

  // ============ DETAIL ============
  function showDetail(id) {
    const record = records.find(item => item.submissionId === id);
    if (!record) return;
    $("#detailType").textContent = `${record.formLabel || "Checklist"} Checklist`;
    $("#detailTitle").textContent = record.submissionId || "Detail";
    const signatures = Object.values(record.signatures || {})
      .map(sig => `${escapeHtml(sig.role || "-")}: ${escapeHtml(sig.name || "-")}`).join("<br>");
    const tasks = (record.tasks || []).map(task => `<tr>
      <td>${escapeHtml(task.code || "-")}</td>
      <td>${escapeHtml(task.text || "-")}</td>
      <td class="${task.answer === "no" ? "status-issue" : "status-ok"}">${escapeHtml((task.answer || "-").toUpperCase())}</td>
      <td>${escapeHtml(task.note || "-")}</td>
    </tr>`).join("");

    const approvalLine = record.approvalStatus === "PENDING_APPROVAL"
      ? `<div><strong>Approval</strong><span class="status-issue">Menunggu Admin Manager</span></div>`
      : record.approvalStatus === "REJECTED"
        ? `<div><strong>Approval</strong><span class="status-issue">Ditolak oleh ${escapeHtml(record.approvedBy || "-")}</span></div>`
        : `<div><strong>Approval</strong><span class="status-ok">Disetujui ${escapeHtml(record.approvedBy || "")}</span></div>`;

    $("#detailBody").innerHTML = `
      <div class="detail-meta">
        <div><strong>Tanggal</strong><span>${escapeHtml(formatDate(record.executionDate))}</span></div>
        <div><strong>Waktu</strong><span>${escapeHtml(record.executionTime || "-")}</span></div>
        <div><strong>PIC</strong><span>${escapeHtml(record.picName || "-")}</span></div>
        <div><strong>Status</strong><span>${escapeHtml((record.summary && record.summary.overallStatus) || "-")}</span></div>
        ${approvalLine}
      </div>
      <div class="table-wrap detail-table">
        <table><thead><tr><th>No</th><th>To Do</th><th>Jawaban</th><th>Keterangan</th></tr></thead>
        <tbody>${tasks}</tbody></table>
      </div>
      <div class="detail-signatures"><strong>Verifikator</strong><p>${signatures || "-"}</p></div>
    `;
    $("#detailDialog").showModal();
  }

  // ============ APPROVAL ============
  function openApprovalById(id) {
    const record = records.find(item => item.submissionId === id);
    if (!record) return;
    openApprovalDialog(record);
  }

  async function openApprovalDialog(record) {
    currentRecord = record;
    $("#approveKicker").textContent = `${record.formLabel || "Checklist"} — ${record.submissionId || ""}`;
    $("#approveTitle").textContent = "Setujui checklist";
    $("#approveName").value = "";
    $("#approveNote").value = "";
    signPad && signPad.clear();

    $("#approveSummary").innerHTML = `
      <div><strong>Tanggal</strong><span>${escapeHtml(formatDate(record.executionDate))}</span></div>
      <div><strong>PIC</strong><span>${escapeHtml(record.picName || "-")}</span></div>
      <div><strong>Status</strong><span>${escapeHtml((record.summary && record.summary.overallStatus) || "-")}</span></div>
      <div><strong>Yes / No</strong><span>${Number((record.summary && record.summary.yes) || 0)} / ${Number((record.summary && record.summary.no) || 0)}</span></div>
    `;
    $("#approveDialog").showModal();

    // FIX: paksa canvas resize setelah dialog terbuka
    const forceResize = () => { if (signPad && signPad.resize) signPad.resize(); };
    requestAnimationFrame(() => {
      forceResize();
      setTimeout(forceResize, 120);
    });

    if (!record.signatureImages) {
      try {
        const result = await apiCall({
          action: "get",
          checklistType: record.checklistType,
          submissionId: record.submissionId,
          adminPin: approveAuth.pin
        });
        if (result.ok && result.record) {
          currentRecord = result.record;
          setTimeout(forceResize, 80);
        }
      } catch (_) { /* lanjut dengan record yang ada */ }
    }
  }

  async function submitApproval(mode) {
    if (!currentRecord) return;
    const managerName = ($("#approveName").value || "").trim();
    const note = ($("#approveNote").value || "").trim();
    const signatureImage = signPad ? signPad.dataUrl() : "";

    if (!managerName) return toast("Nama Admin Manager wajib diisi.", "error");
    if (mode === "approve" && !signatureImage) return toast("Tanda tangan wajib diisi untuk menyetujui.", "error");
    if (mode === "reject" && !note) return toast("Alasan penolakan wajib diisi.", "error");
    if (!approveAuth.pin) return toast("PIN admin belum diisi.", "error");

    setBusy(true);
    try {
      const body = {
        action: mode === "approve" ? "approve" : "reject",
        checklistType: currentRecord.checklistType,
        submissionId: currentRecord.submissionId,
        managerName,
        signatureImage,
        reason: note,
        adminPin: approveAuth.pin,
        approvalToken: approveAuth.token
      };
      const result = await apiCall(body);
      if (!result.ok) throw new Error(result.message || "Gagal memproses approval.");
      toast(result.message || "Berhasil.", "success");
      $("#approveDialog").close();

      if (mode === "approve") {
        const finalRecord = JSON.parse(JSON.stringify(currentRecord));
        finalRecord.approvalStatus = "APPROVED";
        finalRecord.approvedBy = managerName;
        finalRecord.approvedAt = result.approvedAt || new Date().toISOString();
        finalRecord.signatureImages = finalRecord.signatureImages || {};
        finalRecord.signatureImages.adminManager = signatureImage;
        finalRecord.signatures = finalRecord.signatures || {};
        finalRecord.signatures.adminManager = { role: "Admin Manager", name: managerName };

        try {
          await generateApprovalPdf(finalRecord);
          toast("PDF berhasil diunduh untuk filing.", "success", 5500);
        } catch (err) {
          toast("Approval berhasil, tetapi PDF gagal dibuat: " + err.message, "error", 6000);
        }
      }

      if (approveAuth.pin && $("#recordsPanel").hidden === false) {
        await loadRecords();
      }
    } catch (error) { toast(error.message, "error"); }
    finally { setBusy(false); }
  }

  // ============ PDF ============
  async function regeneratePdf(id) {
    const record = records.find(r => r.submissionId === id);
    if (!record) return;
    setBusy(true);
    try {
      const result = await apiCall({
        action: "get",
        checklistType: record.checklistType,
        submissionId: id,
        adminPin: approveAuth.pin
      });
      if (!result.ok) throw new Error(result.message || "Gagal memuat data lengkap.");
      await generateApprovalPdf(result.record);
      toast("PDF berhasil dibuat.", "success");
    } catch (error) { toast(error.message, "error"); }
    finally { setBusy(false); }
  }

  async function generateApprovalPdf(record) {
    const pdfReady = typeof window.ensurePdfLibraries === "function"
      ? await window.ensurePdfLibraries()
      : Boolean(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable);

    if (!pdfReady) {
      exportApprovalWithPrint(record);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const formLabel = String(record.formLabel || "Checklist").toUpperCase();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(`FORM CHECKLIST ${formLabel}`, pageWidth / 2, 16, { align: "center" });
    doc.setFontSize(11);
    doc.text(record.store || "Alam Sutera", pageWidth / 2, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Tanggal: ${formatDateId(record.executionDate)}`, 14, 31);
    doc.text(`Waktu: ${record.executionTime || "-"}`, 14, 36);
    doc.text(`PIC: ${record.picName || "-"}`, 105, 31);
    doc.text(`Status: ${(record.summary && record.summary.overallStatus) || "-"}`, 105, 36);
    doc.text(`Approval: ${record.approvalStatus || "-"}${record.approvedBy ? " oleh " + record.approvedBy : ""}`, 105, 41);

    const body = (record.tasks || []).map(task => [
      task.code,
      task.text,
      task.answer ? task.answer.toUpperCase() : "-",
      task.note || "-"
    ]);

    doc.autoTable({
      startY: 46,
      head: [["No", "To Do", "Jawaban", "Keterangan"]],
      body,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7.6, cellPadding: 2.2, valign: "top" },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 98 }, 2: { cellWidth: 22, halign: "center" }, 3: { cellWidth: 50 } },
      didDrawPage: hookData => {
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`Submission ID: ${record.submissionId || "-"}`, 14, doc.internal.pageSize.getHeight() - 7);
        doc.text(`Halaman ${hookData.pageNumber}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });
      }
    });

    let y = doc.lastAutoTable.finalY + 8;
    if (y > 240) { doc.addPage(); y = 18; }
    doc.setTextColor(23, 33, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Verifikasi", 14, y);
    y += 5;

    const roles = [
      { id: "pic", label: "PIC" },
      { id: "facility", label: "Facility" },
      { id: "security", label: "Security" },
      { id: "adminManager", label: "Admin Manager" }
    ];
    const cardWidth = 43, gap = 4;
    roles.forEach((role, index) => {
      const x = 14 + index * (cardWidth + gap);
      const sig = (record.signatures && record.signatures[role.id]) || {};
      const img = (record.signatureImages && record.signatureImages[role.id]) || "";
      doc.setDrawColor(210);
      doc.rect(x, y, cardWidth, 31);
      if (img) {
        try { doc.addImage(img, "PNG", x + 2, y + 2, cardWidth - 4, 18, undefined, "FAST"); } catch (_) {}
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.4);
      doc.text(sig.name || "Belum diisi", x + cardWidth / 2, y + 23, { align: "center", maxWidth: cardWidth - 3 });
      doc.setFont("helvetica", "bold");
      doc.text(role.label, x + cardWidth / 2, y + 28, { align: "center" });
    });

    const filename = `${formLabel}_Checklist_${safeFilename(record.executionDate || "tanggal")}_${safeFilename(record.submissionId || "draft")}.pdf`;
    doc.save(filename);
  }

  function exportApprovalWithPrint(record) {
    const existing = document.getElementById("pdf-print-frame");
    if (existing) existing.remove();

    const frame = document.createElement("iframe");
    frame.id = "pdf-print-frame";
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";

    const taskRows = (record.tasks || []).map(task => `
      <tr>
        <td class="code">${escapeHtml(task.code)}</td>
        <td><strong>${escapeHtml(task.text)}</strong></td>
        <td class="answer ${task.answer === "no" ? "no" : "yes"}">${escapeHtml((task.answer || "-").toUpperCase())}</td>
        <td>${escapeHtml(task.note || "-")}</td>
      </tr>
    `).join("");

    const roles = [
      { id: "pic", label: "PIC" },
      { id: "facility", label: "Facility" },
      { id: "security", label: "Security" },
      { id: "adminManager", label: "Admin Manager" }
    ];
    const signatureCards = roles.map(role => {
      const sig = (record.signatures && record.signatures[role.id]) || {};
      const img = (record.signatureImages && record.signatureImages[role.id]) || "";
      const imgTag = img ? `<img src="${img}" alt="">` : `<div class="signature-empty"></div>`;
      return `<div class="signature-card-print">${imgTag}<div class="signature-name-print">${escapeHtml(sig.name || "Belum diisi")}</div><strong>${escapeHtml(role.label)}</strong></div>`;
    }).join("");

    const formLabel = String(record.formLabel || "Checklist").toUpperCase();

    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Checklist</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: Arial, sans-serif; color: #17211f; font-size: 9pt; margin: 0; }
        h1 { text-align: center; font-size: 17pt; margin: 0; }
        .store { text-align: center; font-weight: 700; font-size: 11pt; margin: 3px 0 14px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 18px; margin-bottom: 10px; }
        .meta div { border-bottom: 1px solid #b9c4c1; padding: 4px 0; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #8f9b98; padding: 5px; vertical-align: top; }
        th { background: #0f766e; color: white; font-size: 8pt; }
        td.code { text-align: center; width: 8%; }
        td.answer { text-align: center; font-weight: 700; width: 12%; }
        td.answer.no { color: #a3231d; }
        .verification { margin-top: 11px; font-size: 11pt; }
        .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 6px; }
        .signature-card-print { min-height: 37mm; border: 1px solid #aab5b2; padding: 5px; text-align: center; }
        .signature-card-print img { display: block; width: 100%; height: 22mm; object-fit: contain; }
        .footer { margin-top: 9px; display: flex; justify-content: space-between; color: #5f6b68; font-size: 7.5pt; }
      </style></head><body>
      <h1>FORM CHECKLIST ${escapeHtml(formLabel)}</h1>
      <div class="store">${escapeHtml(record.store || "Alam Sutera")}</div>
      <div class="meta">
        <div><strong>Tanggal:</strong> ${escapeHtml(formatDateId(record.executionDate))}</div>
        <div><strong>PIC:</strong> ${escapeHtml(record.picName || "-")}</div>
        <div><strong>Waktu:</strong> ${escapeHtml(record.executionTime || "-")}</div>
        <div><strong>Approval:</strong> ${escapeHtml(record.approvalStatus || "-")}${record.approvedBy ? " — " + escapeHtml(record.approvedBy) : ""}</div>
      </div>
      <table><thead><tr><th>No</th><th>To Do</th><th>Jawaban</th><th>Keterangan</th></tr></thead>
      <tbody>${taskRows}</tbody></table>
      <h2 class="verification">Verifikasi</h2>
      <div class="signatures">${signatureCards}</div>
      <div class="footer"><span>Submission ID: ${escapeHtml(record.submissionId || "-")}</span><span>Dicetak: ${escapeHtml(new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date()))}</span></div>
      </body></html>`;

    frame.onload = () => {
      setTimeout(() => {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {}
      }, 250);
      setTimeout(() => frame.remove(), 60000);
    };
    document.body.appendChild(frame);
    frame.srcdoc = html;
  }

  // ============ SIGNATURE PAD ============
  function setupSignPad() {
    const canvas = $("#approveSignature");
    const wrap = $("#approveWrap");
    if (!canvas || !wrap) {
      console.warn("[admin.js] signature canvas/wrap not found");
      return;
    }
    const ctx = canvas.getContext("2d");
    const state = { drawing: false, signed: false, lastX: 0, lastY: 0 };

    const resize = () => {
      const existing = state.signed ? canvas.toDataURL("image/png") : null;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return; // dialog belum terbuka

      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "#17211f";
      ctx.fillStyle = "#17211f";

      if (existing) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
        };
        img.src = existing;
      }
    };

    const point = event => {
      const rect = canvas.getBoundingClientRect();
      const source = (event.touches && event.touches[0]) || event;
      return { x: source.clientX - rect.left, y: source.clientY - rect.top };
    };

    canvas.addEventListener("pointerdown", event => {
      event.preventDefault();
      try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
      const p = point(event);
      state.drawing = true;
      state.lastX = p.x; state.lastY = p.y;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
      ctx.fill();
      state.signed = true;
      wrap.classList.add("signed");
    });

    canvas.addEventListener("pointermove", event => {
      if (!state.drawing) return;
      event.preventDefault();
      const p = point(event);
      ctx.beginPath();
      ctx.moveTo(state.lastX, state.lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      state.lastX = p.x; state.lastY = p.y;
      state.signed = true;
      wrap.classList.add("signed");
    });

    canvas.addEventListener("pointerup", event => {
      if (!state.drawing) return;
      try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
      state.drawing = false;
    });
    canvas.addEventListener("pointercancel", () => { state.drawing = false; });

    window.addEventListener("resize", () => setTimeout(resize, 180));
    setTimeout(resize, 50);

    signPad = {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.signed = false;
        wrap.classList.remove("signed");
      },
      dataUrl() { return state.signed ? canvas.toDataURL("image/png") : ""; },
      resize() { resize(); }
    };
  }

  // ============ CSV ============
  function exportCsv() {
    const rows = filteredRecords();
    if (!rows.length) return toast("Tidak ada data untuk diexport.", "error");
    const headers = ["Jenis","Submission ID","Store","Tanggal","Waktu","PIC","Status","Approval","Approved By","Yes","No","Dikirim"];
    const body = rows.map(record => [
      record.formLabel, record.submissionId, record.store,
      record.executionDate, record.executionTime, record.picName,
      (record.summary && record.summary.overallStatus) || "",
      record.approvalStatus || "", record.approvedBy || "",
      (record.summary && record.summary.yes) || 0,
      (record.summary && record.summary.no) || 0,
      record.submittedAt
    ]);
    const csv = [headers, ...body].map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `checklist-alam-sutera-${new Date().toISOString().slice(0,10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // ============ UTIL ============
  function setBusy(value) {
    ["#loginButton", "#refreshButton", "#approveButton", "#rejectButton"].forEach(sel => {
      const el = $(sel);
      if (el) el.disabled = value;
    });
  }
  function toast(message, type = "") {
    const region = $("#toastRegion");
    if (!region) { console.warn("[toast]", message); return; }
    const el = document.createElement("div");
    el.className = `toast ${type}`.trim();
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }
  function formatDate(value) {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(`${value}T00:00:00`));
    } catch (_) { return value; }
  }
  function formatDateId(value) {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" })
        .format(new Date(`${value}T00:00:00`));
    } catch (_) { return value; }
  }
  function formatDateTime(value) {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
    } catch (_) { return value; }
  }
  function safeFilename(value) {
    return String(value).replace(/[^a-z0-9_-]+/gi, "-").replace(/-+/g, "-");
  }
  function csvCell(value) { return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`; }
  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
})();

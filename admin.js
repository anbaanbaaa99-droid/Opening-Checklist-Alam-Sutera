(() => {
  "use strict";
  const CONFIG = window.CHECKLIST_APP_CONFIG || {};
  let records = [];
  let adminPin = "";
  let currentRecord = null;
  let approveAuth = { pin: "", token: "" };
  let signPad = null;

  const $ = selector => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    $("#loginButton").addEventListener("click", login);
    $("#adminPin").addEventListener("keydown", event => { if (event.key === "Enter") login(); });
    $("#refreshButton").addEventListener("click", loadRecords);
    $("#searchInput").addEventListener("input", render);
    $("#typeFilter").addEventListener("change", render);
    $("#statusFilter").addEventListener("change", render);
    $("#approvalFilter").addEventListener("change", render);
    $("#csvButton").addEventListener("click", exportCsv);

    $("#recordBody").addEventListener("click", event => {
      const detailBtn = event.target.closest("[data-detail-id]");
      if (detailBtn) { showDetail(detailBtn.dataset.detailId); return; }
      const approveBtn = event.target.closest("[data-approve-id]");
      if (approveBtn) { openApprovalById(approveBtn.dataset.approveId); }
    });

    $("#closeDetailButton").addEventListener("click", () => $("#detailDialog").close());
    $("#closeApproveButton").addEventListener("click", () => $("#approveDialog").close());
    $("#clearApproveSignature").addEventListener("click", () => signPad && signPad.clear());
    $("#approveButton").addEventListener("click", () => submitApproval("approve"));
    $("#rejectButton").addEventListener("click", () => submitApproval("reject"));

    setupSignPad();

    // Kalau ada ?approve=<id>&token=<token>&type=<opening|closing>
    const params = new URLSearchParams(location.search);
    const approveId = params.get("approve");
    const token = params.get("token");
    const type = params.get("type");
    if (approveId && type) {
      approveAuth.token = token || "";
      $("#loginPanel").hidden = true;
      $("#recordsPanel").hidden = true;
      loadSingleForApproval(approveId, type);
    }
  }

  async function login() {
    adminPin = $("#adminPin").value.trim();
    if (!adminPin) return toast("PIN admin wajib diisi.", "error");
    approveAuth.pin = adminPin;
    await loadRecords();
  }

  async function loadRecords() {
    if (!CONFIG.apiUrl || CONFIG.apiUrl.includes("PASTE_YOUR")) {
      return toast("URL Apps Script belum diatur di config.js.", "error");
    }
    setBusy(true);
    try {
      const result = await apiCall({ action: "list", adminPin, limit: 500 });
      if (!result.ok) throw new Error(result.message || "Gagal memuat data.");
      records = result.records || [];
      $("#loginPanel").hidden = true;
      $("#recordsPanel").hidden = false;
      render();
      toast("Riwayat berhasil dimuat.", "success");
    } catch (error) { toast(error.message, "error"); }
    finally { setBusy(false); }
  }

  async function loadSingleForApproval(id, type) {
    setBusy(true);
    try {
      const result = await apiCall({
        action: "get",
        checklistType: type,
        submissionId: id,
        approvalToken: approveAuth.token
      });
      if (!result.ok) throw new Error(result.message || "Gagal memuat data.");
      records = [result.record];
      openApprovalDialog(result.record);
    } catch (error) { toast(error.message, "error"); }
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

  function filteredRecords() {
    const query = $("#searchInput").value.trim().toLowerCase();
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
    $("#recordCount").textContent = `${rows.length} checklist`;
    $("#emptyState").hidden = rows.length > 0;
    $("#recordBody").innerHTML = rows.map(record => {
      const status = (record.summary && record.summary.overallStatus) || "-";
      const statusClass = status === "SELESAI" ? "status-ok" : "status-issue";
      const typeClass = record.checklistType === "closing"
        ? "type-badge type-badge--closing"
        : "type-badge type-badge--opening";
      const approval = record.approvalStatus || "APPROVED";
      const approvalBadge = renderApprovalBadge(approval);
      const canApprove = approval === "PENDING_APPROVAL";
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
        <td>
          <button class="button button--secondary button--small" data-detail-id="${escapeHtml(record.submissionId || "")}">Detail</button>
          ${canApprove ? `<button class="button button--primary button--small" data-approve-id="${escapeHtml(record.submissionId || "")}">Approve</button>` : ""}
        </td>
      </tr>`;
    }).join("");
  }

  function renderApprovalBadge(status) {
    if (status === "PENDING_APPROVAL") return `<span class="approval-badge approval-badge--pending">Menunggu</span>`;
    if (status === "REJECTED") return `<span class="approval-badge approval-badge--rejected">Ditolak</span>`;
    return `<span class="approval-badge approval-badge--approved">Disetujui</span>`;
  }

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

  function openApprovalById(id) {
    const record = records.find(item => item.submissionId === id);
    if (!record) return;
    openApprovalDialog(record);
  }

  function openApprovalDialog(record) {
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
  }

  async function submitApproval(mode) {
    if (!currentRecord) return;
    const managerName = $("#approveName").value.trim();
    const note = $("#approveNote").value.trim();
    const signatureImage = signPad ? signPad.dataUrl() : "";

    if (!managerName) return toast("Nama Admin Manager wajib diisi.", "error");
    if (mode === "approve" && !signatureImage) return toast("Tanda tangan wajib diisi untuk menyetujui.", "error");
    if (mode === "reject" && !note) return toast("Alasan penolakan wajib diisi.", "error");

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
      if (approveAuth.pin) await loadRecords();
    } catch (error) { toast(error.message, "error"); }
    finally { setBusy(false); }
  }

  function setupSignPad() {
    const canvas = $("#approveSignature");
    const wrap = $("#approveWrap");
    const ctx = canvas.getContext("2d");
    const state = { drawing: false, signed: false, lastX: 0, lastY: 0 };

    const resize = () => {
      const existing = state.signed ? canvas.toDataURL("image/png") : null;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "#17211f";
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
      const p = point(event);
      state.drawing = true;
      state.lastX = p.x; state.lastY = p.y;
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
    window.addEventListener("pointerup", () => { state.drawing = false; });
    window.addEventListener("resize", () => setTimeout(resize, 150));
    setTimeout(resize, 50);

    signPad = {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.signed = false;
        wrap.classList.remove("signed");
      },
      dataUrl() { return state.signed ? canvas.toDataURL("image/png") : ""; }
    };
  }

  function exportCsv() {
    const rows = filteredRecords();
    if (!rows.length) return toast("Tidak ada data untuk diexport.", "error");
    const headers = ["Jenis","Submission ID","Store","Tanggal","Waktu","PIC","Status","Approval","Approved By","Yes","No","Dikirim"];
    const body = rows.map(record => [
      record.formLabel,
      record.submissionId,
      record.store,
      record.executionDate,
      record.executionTime,
      record.picName,
      (record.summary && record.summary.overallStatus) || "",
      record.approvalStatus || "",
      record.approvedBy || "",
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

  function setBusy(value) {
    $("#loginButton").disabled = value;
    $("#refreshButton").disabled = value;
    $("#approveButton").disabled = value;
    $("#rejectButton").disabled = value;
  }
  function toast(message, type = "") {
    const el = document.createElement("div");
    el.className = `toast ${type}`.trim();
    el.textContent = message;
    $("#toastRegion").appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(`${value}T00:00:00`));
  }
  function formatDateTime(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  }
  function csvCell(value) { return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`; }
  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
})();

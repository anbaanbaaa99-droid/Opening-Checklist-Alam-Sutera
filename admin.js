(() => {
  "use strict";
  const CONFIG = window.CHECKLIST_APP_CONFIG || {};
  let records = [];
  let adminPin = "";
  const $ = selector => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", () => {
    $("#loginButton").addEventListener("click", login);
    $("#adminPin").addEventListener("keydown", event => { if (event.key === "Enter") login(); });
    $("#refreshButton").addEventListener("click", loadRecords);
    $("#searchInput").addEventListener("input", render);
    $("#typeFilter").addEventListener("change", render);
    $("#statusFilter").addEventListener("change", render);
    $("#csvButton").addEventListener("click", exportCsv);
    $("#recordBody").addEventListener("click", event => {
      const button = event.target.closest("[data-detail-id]");
      if (button) showDetail(button.dataset.detailId);
    });
    $("#closeDetailButton").addEventListener("click", () => $("#detailDialog").close());
  });

  async function login() {
    adminPin = $("#adminPin").value.trim();
    if (!adminPin) return toast("PIN admin wajib diisi.", "error");
    await loadRecords();
  }

  async function loadRecords() {
    if (!CONFIG.apiUrl || CONFIG.apiUrl.includes("PASTE_YOUR")) return toast("URL Apps Script belum diatur di config.js.", "error");
    setBusy(true);
    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "list", adminPin, limit: 500 }),
        redirect: "follow"
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.message || "Gagal memuat data.");
      records = result.records || [];
      $("#loginPanel").hidden = true;
      $("#recordsPanel").hidden = false;
      render();
      toast("Riwayat opening dan closing berhasil dimuat.", "success");
    } catch (error) { toast(error.message, "error"); }
    finally { setBusy(false); }
  }

  function filteredRecords() {
    const query = $("#searchInput").value.trim().toLowerCase();
    const type = $("#typeFilter").value;
    const status = $("#statusFilter").value;
    return records.filter(record => {
      const haystack = [record.submissionId, record.executionDate, record.picName, record.store, record.formLabel].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (!type || record.checklistType === type) && (!status || record.summary?.overallStatus === status);
    });
  }

  function render() {
    const rows = filteredRecords();
    $("#recordCount").textContent = `${rows.length} checklist`;
    $("#emptyState").hidden = rows.length > 0;
    $("#recordBody").innerHTML = rows.map(record => {
      const status = record.summary?.overallStatus || "-";
      const statusClass = status === "SELESAI" ? "status-ok" : "status-issue";
      const typeClass = record.checklistType === "closing" ? "type-badge type-badge--closing" : "type-badge type-badge--opening";
      return `<tr>
        <td><span class="${typeClass}">${escapeHtml(record.formLabel || "-")}</span></td>
        <td>${escapeHtml(record.submissionId || "-")}</td>
        <td>${escapeHtml(formatDate(record.executionDate))}</td>
        <td>${escapeHtml(record.executionTime || "-")}</td>
        <td>${escapeHtml(record.picName || "-")}</td>
        <td class="${statusClass}">${escapeHtml(status)}</td>
        <td>${Number(record.summary?.yes || 0)}</td>
        <td>${Number(record.summary?.no || 0)}</td>
        <td>${escapeHtml(formatDateTime(record.submittedAt))}</td>
        <td><button class="button button--secondary button--small" data-detail-id="${escapeHtml(record.submissionId || "")}">Detail</button></td>
      </tr>`;
    }).join("");
  }

  function showDetail(id) {
    const record = records.find(item => item.submissionId === id);
    if (!record) return;
    $("#detailType").textContent = `${record.formLabel || "Checklist"} Checklist`;
    $("#detailTitle").textContent = record.submissionId || "Detail";
    const signatures = Object.values(record.signatures || {}).map(sig => `${escapeHtml(sig.role || "-")}: ${escapeHtml(sig.name || "-")}`).join("<br>");
    const tasks = (record.tasks || []).map(task => `<tr><td>${escapeHtml(task.code || "-")}</td><td>${escapeHtml(task.text || "-")}</td><td class="${task.answer === "no" ? "status-issue" : "status-ok"}">${escapeHtml((task.answer || "-").toUpperCase())}</td><td>${escapeHtml(task.note || "-")}</td></tr>`).join("");
    $("#detailBody").innerHTML = `
      <div class="detail-meta"><div><strong>Tanggal</strong><span>${escapeHtml(formatDate(record.executionDate))}</span></div><div><strong>Waktu</strong><span>${escapeHtml(record.executionTime || "-")}</span></div><div><strong>PIC</strong><span>${escapeHtml(record.picName || "-")}</span></div><div><strong>Status</strong><span>${escapeHtml(record.summary?.overallStatus || "-")}</span></div></div>
      <div class="table-wrap detail-table"><table><thead><tr><th>No</th><th>To Do</th><th>Jawaban</th><th>Keterangan</th></tr></thead><tbody>${tasks}</tbody></table></div>
      <div class="detail-signatures"><strong>Verifikator</strong><p>${signatures || "-"}</p></div>`;
    $("#detailDialog").showModal();
  }

  function exportCsv() {
    const rows = filteredRecords();
    if (!rows.length) return toast("Tidak ada data untuk diexport.", "error");
    const headers = ["Jenis", "Submission ID", "Store", "Tanggal", "Waktu", "PIC", "Status", "Yes", "No", "Dikirim"];
    const body = rows.map(record => [record.formLabel, record.submissionId, record.store, record.executionDate, record.executionTime, record.picName, record.summary?.overallStatus, record.summary?.yes, record.summary?.no, record.submittedAt]);
    const csv = [headers, ...body].map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `checklist-alam-sutera-${new Date().toISOString().slice(0,10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function setBusy(value) { $("#loginButton").disabled = value; $("#refreshButton").disabled = value; }
  function toast(message, type = "") { const el = document.createElement("div"); el.className = `toast ${type}`.trim(); el.textContent = message; $("#toastRegion").appendChild(el); setTimeout(() => el.remove(), 4200); }
  function formatDate(value) { if (!value) return "-"; return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
  function formatDateTime(value) { if (!value) return "-"; return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
  function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
})();
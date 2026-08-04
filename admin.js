(() => {
  "use strict";
  const CONFIG = window.OPENING_APP_CONFIG || {};
  let records = [];
  let adminPin = "223344";

  const $ = selector => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", () => {
    $("#loginButton").addEventListener("click", login);
    $("#adminPin").addEventListener("keydown", event => { if (event.key === "Enter") login(); });
    $("#refreshButton").addEventListener("click", loadRecords);
    $("#searchInput").addEventListener("input", render);
    $("#statusFilter").addEventListener("change", render);
    $("#csvButton").addEventListener("click", exportCsv);
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
        body: JSON.stringify({ action: "list", adminPin, limit: 200 }),
        redirect: "follow"
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.message || "Gagal memuat data.");
      records = result.records || [];
      $("#loginPanel").hidden = true;
      $("#recordsPanel").hidden = false;
      render();
      toast("Riwayat berhasil dimuat.", "success");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function filteredRecords() {
    const query = $("#searchInput").value.trim().toLowerCase();
    const status = $("#statusFilter").value;
    return records.filter(record => {
      const haystack = [record.submissionId, record.openingDate, record.picOpening, record.store].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (!status || record.summary?.overallStatus === status);
    });
  }

  function render() {
    const rows = filteredRecords();
    $("#recordCount").textContent = `${rows.length} checklist`;
    $("#emptyState").hidden = rows.length > 0;
    $("#recordBody").innerHTML = rows.map(record => {
      const status = record.summary?.overallStatus || "-";
      const statusClass = status === "SELESAI" ? "status-ok" : "status-issue";
      return `<tr>
        <td>${escapeHtml(record.submissionId || "-")}</td>
        <td>${escapeHtml(formatDate(record.openingDate))}</td>
        <td>${escapeHtml(record.openingTime || "-")}</td>
        <td>${escapeHtml(record.picOpening || "-")}</td>
        <td class="${statusClass}">${escapeHtml(status)}</td>
        <td>${Number(record.summary?.yes || 0)}</td>
        <td>${Number(record.summary?.no || 0)}</td>
        <td>${escapeHtml(formatDateTime(record.submittedAt))}</td>
      </tr>`;
    }).join("");
  }

  function exportCsv() {
    const rows = filteredRecords();
    if (!rows.length) return toast("Tidak ada data untuk diexport.", "error");
    const headers = ["Submission ID", "Store", "Tanggal", "Waktu", "PIC Opening", "Status", "Yes", "No", "Dikirim"];
    const body = rows.map(record => [
      record.submissionId, record.store, record.openingDate, record.openingTime, record.picOpening,
      record.summary?.overallStatus, record.summary?.yes, record.summary?.no, record.submittedAt
    ]);
    const csv = [headers, ...body].map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `opening-checklist-${new Date().toISOString().slice(0,10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function setBusy(value) {
    $("#loginButton").disabled = value;
    $("#refreshButton").disabled = value;
  }

  function toast(message, type = "") {
    const el = document.createElement("div");
    el.className = `toast ${type}`.trim();
    el.textContent = message;
    $("#toastRegion").appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
  }
  function formatDateTime(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  }
  function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
})();

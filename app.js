(() => {
  "use strict";

  const CONFIG = window.CHECKLIST_APP_CONFIG || {};
  const FORM_TYPE = String(document.body.dataset.checklistType || "opening").toLowerCase();
  const FORMS = {
    opening: { label: "Opening", code: "OPN", dateLabel: "Tanggal opening", timeLabel: "Waktu mulai", picLabel: "PIC Opening", groups: [
    {
      no: 1,
      title: "Masuk ruang Control Room",
      titleEn: "Go to the Control Room",
      tasks: [
        { code: "1A", id: "control-room-keybox", idText: "Membuka password key box di ruang kontrol untuk mengambil kunci admin key box dan facility key box.", enText: "Open the passcode key box in the control room to retrieve the admin key box and facility key box keys." }
      ]
    },
    {
      no: 2,
      title: "Menuju ruang Management Office",
      titleEn: "Go to the Management Office",
      tasks: [
        { code: "2A", id: "swipe-card", idText: "Menggunakan swipe card untuk masuk ke ruang Management Office.", enText: "Use the swipe card to enter the Management Office." },
        { code: "2B", id: "open-keybox", idText: "Membuka key box.", enText: "Open the key box." },
        { code: "2C", id: "take-floor-keys", idText: "Mengambil kunci untuk masing-masing lantai dari key box.", enText: "Retrieve the keys for each floor from the key box." },
        { code: "2D", id: "open-support-rooms", idText: "Membuka ruang CDM, Meeting Room, dan Stockroom.", enText: "Open the CDM Room, Meeting Room, and Stockroom." },
        { code: "2E", id: "open-emergency-waste", idText: "Membuka pintu darurat dan area limbah B3, Dry Bin, dan Wet Bin.", enText: "Open the emergency doors and the B3, Dry Bin, and Wet Bin waste areas." }
      ]
    },
    {
      no: 3,
      title: "Menuju Lower Ground (LG)",
      titleEn: "Go to the Lower Ground Floor",
      tasks: [
        { code: "3A", id: "open-mmd", idText: "Membuka ruang MMD.", enText: "Open the MMD Room." },
        { code: "3B", id: "open-loading-bay-shutter", idText: "Membuka shutter box di Loading Bay.", enText: "Open the shutter box in the Loading Bay." }
      ]
    },
    {
      no: 4,
      title: "Menuju area penjualan",
      titleEn: "Go to the Selling Area",
      tasks: [
        { code: "4A", id: "open-selling-area", idText: "Membuka kunci Glass Door HBC dan membuka seluruh shutter box di area LG.", enText: "Unlock the HBC glass door and open all shutter boxes in the LG area." }
      ]
    },
    {
      no: 5,
      title: "Pemeriksaan kondisi awal",
      titleEn: "Initial Condition Check",
      tasks: [
        { code: "5A", id: "utilities-off", idText: "Memastikan gas, listrik, air, dan peralatan produksi masih dalam kondisi off.", enText: "Make sure gas, electricity, water, and production equipment remain switched off." }
      ]
    },
    {
      no: 6,
      title: "Penyelesaian link opening dan pengembalian kunci",
      titleEn: "Complete the Opening Link and Return the Key",
      tasks: [
        { code: "6A", id: "opening-link-return-key", idText: "Mengisi link opening dan meletakkan kembali kunci master ke keybox.", enText: "Complete the opening link and return the master key to the key box." }
      ]
    },
    {
      no: 7,
      title: "Pengisian logbook dan dokumen opening",
      titleEn: "Complete the Opening Logbook and Documents",
      tasks: [
        { code: "7A", id: "logbook-documents", idText: "Mengisi logbook opening, meletakkan master box di meja Admin Manager beserta form checklist opening, dan memastikan seluruh form telah ditandatangani.", enText: "Complete the opening logbook, place the master box and opening checklist forms on the Admin Manager's desk, and ensure all forms are signed." }
      ]
    },
    {
      no: 8,
      title: "Persiapan menjelang toko dibuka",
      titleEn: "Preparation Before Store Opening",
      tasks: [
        { code: "8A", id: "security-open-doors", idText: "Menjelang toko dibuka, setiap security berjaga di seluruh customer entrance dan membuka seluruh shutter door secara bersamaan pada pukul 08.00.", enText: "Before the store opens, security personnel stand by at every customer entrance and open all shutter doors simultaneously at 08:00." }
      ]
    },
    {
      no: 9,
      title: "Pemeriksaan setelah opening",
      titleEn: "Post-opening Check",
      tasks: [
        { code: "9A", id: "lock-shutter-boxes", idText: "Setelah toko dibuka, Opening Assistant Group Leader berkeliling kembali untuk mengunci setiap shutter box di tiap lantai.", enText: "After the store opens, the Opening Assistant Group Leader makes another round to lock every shutter box on each floor." }
      ]
    }
  ] },
    closing: { label: "Closing", code: "CLS", dateLabel: "Tanggal closing", timeLabel: "Waktu closing", picLabel: "PIC Closing", groups: [
    {
      no: 1,
      title: "Pemeriksaan area backroom",
      titleEn: "Check the Backroom Area",
      tasks: [
        { code: "1A", id: "check-backroom-area", idText: "Mengecek area backroom, mengunci dan mematikan lampu (kecuali CMD room) seluruh ruangan yang ada di backroom mulai dari B1 sampai lantai LG (Loading Dock & Pick Up Point Raisa).", enText: "Check the backroom area, lock and turn off the lights (except the CMD room) in all backroom areas from B1 to the LG floor, including the Loading Dock and Pick Up Point Raisa." }
      ]
    },
    {
      no: 2,
      title: "Pemeriksaan selling floor dan akses area toko",
      titleEn: "Check the Selling Floor and Store Access Areas",
      tasks: [
        { code: "2A", id: "check-selling-floor", idText: "Mengecek keseluruhan selling floor, memastikan sudah tidak ada customer di store, sekaligus mengunci Shutter Box, Glass Doors HBC, Sitting area outdoor, dan Delicafe.", enText: "Check the entire selling floor, make sure there are no customers in the store, and lock the Shutter Box, HBC Glass Doors, outdoor sitting area, and Delicafe." }
      ]
    },
    {
      no: 3,
      title: "Memastikan utilitas dan peralatan produksi off",
      titleEn: "Ensure Utilities and Production Equipment Are Off",
      tasks: [
        { code: "3A", id: "utilities-production-off", idText: "Memastikan gas, listrik, air, dan peralatan produksi dalam kondisi off.", enText: "Make sure gas, electricity, water, and production equipment are off." }
      ]
    },
    {
      no: 4,
      title: "Memastikan toilet kosong",
      titleEn: "Ensure the Toilet Is Empty",
      tasks: [
        { code: "4A", id: "ensure-toilet-empty", idText: "Memastikan tidak ada orang di toilet.", enText: "Make sure there is no one in the toilet." }
      ]
    },
    {
      no: 5,
      title: "Penguncian area tertentu",
      titleEn: "Lock Specific Areas",
      tasks: [
        { code: "5A", id: "lock-specific-areas", idText: "Mengunci storage HBC, MMD office, dan mengunci shutter Loading Bay.", enText: "Lock the HBC storage, MMD office, and the Loading Bay shutter." }
      ]
    },
    {
      no: 6,
      title: "Mematikan peralatan elektronik di dalam office",
      titleEn: "Turn Off Electronic Equipment in the Office",
      tasks: [
        { code: "6A", id: "turn-off-photocopy", idText: "Mematikan mesin photocopy.", enText: "Turn off the photocopy machines." },
        { code: "6B", id: "turn-off-computer-screens", idText: "Mematikan semua layar komputer.", enText: "Turn off all computer screens." },
        { code: "6C", id: "ensure-all-rooms-locked", idText: "Mengecek dan memastikan semua room dalam keadaan terkunci.", enText: "Check and ensure all rooms are in a locked condition." },
        { code: "6D", id: "ensure-it-room-locked", idText: "Mengecek dan memastikan IT room dalam keadaan terkunci.", enText: "Check and ensure the IT room is in a locked condition." },
        { code: "6E", id: "store-master-keys-sq-box", idText: "Kunci master box dan kunci shutter dibawa untuk disimpan di SQ box.", enText: "Bring the master box key and shutter key to be stored in the SQ box." },
        { code: "6F", id: "turn-off-ac-lights-office", idText: "Mematikan seluruh AC dan lampu di office management dan meeting room.", enText: "Turn off all air conditioners and lights in the Management Office and Meeting Room." }
      ]
    },
    {
      no: 7,
      title: "Menutup pintu masuk office",
      titleEn: "Close the Office Entrance Door",
      tasks: [
        { code: "7A", id: "close-office-door", idText: "Menutup pintu masuk office.", enText: "Close the office entrance door." }
      ]
    },
    {
      no: 8,
      title: "Mengisi form checklist closing",
      titleEn: "Fill Out the Closing Checklist",
      tasks: [
        { code: "8A", id: "fill-closing-checklist", idText: "Mengisi form checklist closing.", enText: "Fill out the closing checklist form." }
      ]
    },
    {
      no: 9,
      title: "Mengembalikan kunci admin key box",
      titleEn: "Return the Admin Key Box Key",
      tasks: [
        { code: "9A", id: "return-admin-keybox-key", idText: "Meletakkan kunci keybox admin ke dalam keybox di ruang Control Room.", enText: "Put the admin key box key back into the key box in the Control Room." }
      ]
    }
  ] }
  };
  const FORM = FORMS[FORM_TYPE] || FORMS.opening;
  const DRAFT_KEY = `alam-sutera-${FORM_TYPE}-draft-v2`;
  const QUEUE_KEY = "alam-sutera-checklist-queue-v2";
  const DEVICE_KEY = "alam-sutera-checklist-device-id";
  const checklistGroups = FORM.groups;
  const signatureRoles = [
    { id: "pic", label: FORM.picLabel },
    { id: "facility", label: "Facility" },
    { id: "security", label: "Security" },
    { id: "adminManager", label: "Admin Manager" }
  ];

  const allTasks = checklistGroups.flatMap(group => group.tasks.map(task => ({ ...task, groupNo: group.no, groupTitle: group.title })));
  const signaturePads = new Map();
  let autoSaveTimer = null;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function init() {
    document.title = `${FORM.label} Checklist — ${CONFIG.storeName || "Alam Sutera"}`;
    $("#checklistTitle").textContent = `${FORM.label} Checklist`;
    $("#infoKicker").textContent = `Informasi ${FORM.label.toLowerCase()}`;
    $("#dateLabel").textContent = FORM.dateLabel;
    $("#timeLabel").textContent = FORM.timeLabel;
    $("#picLabel").textContent = FORM.picLabel;
    $("#picName").placeholder = `Nama lengkap ${FORM.picLabel}`;
    $("#storeLabel").textContent = CONFIG.storeName || "Alam Sutera";
    $("#appVersion").textContent = `${FORM.label} Checklist v${CONFIG.appVersion || "2.0.0"}`;
    renderChecklist();
    renderSignatures();
    setDefaultDateTime();
    bindEvents();
    restoreDraft();
    updateProgress();
    updateNetworkStatus();
    flushQueue();
    registerServiceWorker();
  }

  function renderChecklist() {
    $("#checklistContainer").innerHTML = checklistGroups.map(group => `
      <article class="checklist-card" data-group="${group.no}">
        <header class="group-header">
          <span class="group-number">${group.no}</span>
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.titleEn)}</p>
          </div>
        </header>
        <div class="task-list">
          ${group.tasks.map(task => `
            <div class="task-row" id="row-${task.id}" data-task-id="${task.id}">
              <div class="task-top">
                <div>
                  <span class="task-code">${task.code}</span>
                  <p class="task-title">${escapeHtml(task.idText)}</p>
                  <p class="task-en">${escapeHtml(task.enText)}</p>
                </div>
                <div class="choice-group" role="radiogroup" aria-label="Jawaban ${task.code}">
                  <label class="choice choice--yes">
                    <input type="radio" name="answer-${task.id}" value="yes" />
                    <span>Yes</span>
                  </label>
                  <label class="choice choice--no">
                    <input type="radio" name="answer-${task.id}" value="no" />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div class="task-note-wrap">
                <textarea class="task-note" id="note-${task.id}" rows="2" placeholder="Keterangan atau tindak lanjut"></textarea>
                <span class="note-hint" id="hint-${task.id}">Opsional untuk jawaban Yes. Wajib diisi untuk jawaban No.</span>
              </div>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function renderSignatures() {
    $("#signatureContainer").innerHTML = signatureRoles.map(role => `
      <article class="signature-card" data-signature-role="${role.id}">
        <h3>${role.label}</h3>
        <input class="signature-name" id="name-${role.id}" type="text" placeholder="Nama lengkap" aria-label="Nama ${role.label}" />
        <div class="signature-canvas-wrap" id="wrap-${role.id}">
          <canvas class="signature-canvas" id="signature-${role.id}" aria-label="Tanda tangan ${role.label}"></canvas>
          <span class="signature-placeholder">Tanda tangan di sini</span>
        </div>
        <div class="signature-actions"><button class="link-button" type="button" data-clear-signature="${role.id}">Hapus tanda tangan</button></div>
      </article>
    `).join("");

    signatureRoles.forEach(role => setupSignaturePad(role.id));
  }

  function setupSignaturePad(roleId) {
    const canvas = $(`#signature-${roleId}`);
    const wrap = $(`#wrap-${roleId}`);
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
      if (existing) loadSignatureImage(roleId, existing);
    };

    const point = event => {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches?.[0] || event;
      return { x: source.clientX - rect.left, y: source.clientY - rect.top };
    };

    const start = event => {
      event.preventDefault();
      const p = point(event);
      state.drawing = true;
      state.lastX = p.x;
      state.lastY = p.y;
    };

    const move = event => {
      if (!state.drawing) return;
      event.preventDefault();
      const p = point(event);
      ctx.beginPath();
      ctx.moveTo(state.lastX, state.lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      state.lastX = p.x;
      state.lastY = p.y;
      state.signed = true;
      wrap.classList.add("signed");
    };

    const end = () => {
      if (!state.drawing) return;
      state.drawing = false;
      scheduleAutoSave();
    };

    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("resize", debounce(resize, 180));
    resize();

    signaturePads.set(roleId, {
      canvas,
      state,
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.signed = false;
        wrap.classList.remove("signed");
      },
      dataUrl() { return state.signed ? canvas.toDataURL("image/png") : ""; }
    });
  }

  function loadSignatureImage(roleId, dataUrl) {
    if (!dataUrl) return;
    const pad = signaturePads.get(roleId);
    if (!pad) return;
    const img = new Image();
    img.onload = () => {
      const ctx = pad.canvas.getContext("2d");
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
      ctx.drawImage(img, 0, 0, pad.canvas.width / ratio, pad.canvas.height / ratio);
      pad.state.signed = true;
      $(`#wrap-${roleId}`).classList.add("signed");
    };
    img.src = dataUrl;
  }

  function bindEvents() {
    $("#checklistForm").addEventListener("submit", handleSubmit);
    $("#saveDraftButton").addEventListener("click", () => saveDraft(true));
    $("#pdfButton").addEventListener("click", exportPdf);
    $("#resetButton").addEventListener("click", confirmReset);

    $("#checklistContainer").addEventListener("change", event => {
      if (event.target.matches('input[type="radio"]')) {
        const row = event.target.closest(".task-row");
        row.classList.add("has-answer");
        row.classList.toggle("answer-no", event.target.value === "no");
        const note = row.querySelector(".task-note");
        const hint = row.querySelector(".note-hint");
        hint.classList.toggle("required", event.target.value === "no");
        note.placeholder = event.target.value === "no" ? "Wajib: jelaskan kendala dan tindak lanjut" : "Keterangan tambahan (opsional)";
        updateProgress();
        scheduleAutoSave();
      }
    });

    $("#checklistForm").addEventListener("input", scheduleAutoSave);
    $("#signatureContainer").addEventListener("click", event => {
      const button = event.target.closest("[data-clear-signature]");
      if (!button) return;
      signaturePads.get(button.dataset.clearSignature)?.clear();
      scheduleAutoSave();
    });

    window.addEventListener("online", () => { updateNetworkStatus(); flushQueue(); });
    window.addEventListener("offline", updateNetworkStatus);
  }

  function setDefaultDateTime() {
    const now = new Date();
    if (!$("#executionDate").value) $("#executionDate").value = localDate(now);
    if (!$("#executionTime").value) $("#executionTime").value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function collectData() {
    const tasks = allTasks.map(task => {
      const answer = document.querySelector(`input[name="answer-${task.id}"]:checked`)?.value || "";
      return {
        code: task.code,
        id: task.id,
        groupNo: task.groupNo,
        groupTitle: task.groupTitle,
        text: task.idText,
        textEn: task.enText,
        answer,
        note: $(`#note-${task.id}`).value.trim()
      };
    });

    const signatures = {};
    signatureRoles.forEach(role => {
      signatures[role.id] = {
        role: role.label,
        name: $(`#name-${role.id}`).value.trim(),
        image: signaturePads.get(role.id)?.dataUrl() || ""
      };
    });

    const answered = tasks.filter(task => task.answer).length;
    const failed = tasks.filter(task => task.answer === "no").length;

    return {
      action: "submit",
      checklistType: FORM_TYPE,
      formLabel: FORM.label,
      submissionId: createSubmissionId(),
      submittedAt: new Date().toISOString(),
      store: CONFIG.storeName || "Alam Sutera",
      executionDate: $("#executionDate").value,
      executionTime: $("#executionTime").value,
      picName: $("#picName").value.trim(),
      tasks,
      signatures,
      declarationAccepted: $("#declaration").checked,
      summary: {
        total: tasks.length,
        answered,
        yes: tasks.filter(task => task.answer === "yes").length,
        no: failed,
        completionPercent: Math.round((answered / tasks.length) * 100),
        overallStatus: failed ? "PERLU TINDAK LANJUT" : "SELESAI"
      },
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      appVersion: CONFIG.appVersion || "1.0.0"
    };
  }

  function validate(data, { requireSignatures = true } = {}) {
    clearInvalidStates();
    const errors = [];

    [["executionDate", data.executionDate, `${FORM.dateLabel} wajib diisi.`], ["executionTime", data.executionTime, `${FORM.timeLabel} wajib diisi.`], ["picName", data.picName, `${FORM.picLabel} wajib diisi.`]].forEach(([id, value, message]) => {
      if (!value) { errors.push(message); $(`#${id}`).classList.add("invalid"); }
    });

    data.tasks.forEach(task => {
      const row = $(`#row-${task.id}`);
      if (!task.answer) {
        errors.push(`${task.code} belum dijawab.`);
        row?.classList.add("invalid-card");
      }
      if (task.answer === "no" && !task.note) {
        errors.push(`Keterangan untuk ${task.code} wajib diisi karena jawabannya No.`);
        $(`#note-${task.id}`).classList.add("invalid");
      }
    });

    if (requireSignatures) {
      signatureRoles.forEach(role => {
        const signature = data.signatures[role.id];
        if (!signature.name) {
          errors.push(`Nama ${role.label} wajib diisi.`);
          $(`#name-${role.id}`).classList.add("invalid");
        }
        if (!signature.image) {
          errors.push(`Tanda tangan ${role.label} wajib diisi.`);
          $(`#wrap-${role.id}`).classList.add("invalid");
        }
      });
      if (!data.declarationAccepted) errors.push("Pernyataan pertanggungjawaban wajib disetujui.");
    }

    return errors;
  }

  function clearInvalidStates() {
    $$(".invalid").forEach(el => el.classList.remove("invalid"));
    $$(".invalid-card").forEach(el => el.classList.remove("invalid-card"));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const data = collectData();
    const errors = validate(data);
    if (errors.length) {
      showToast(errors[0], "error");
      focusFirstInvalid();
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendToBackend(data);
      if (!result.ok) throw new Error(result.message || "Backend menolak data.");
      localStorage.removeItem(DRAFT_KEY);
      showToast(`Checklist berhasil dikirim. ID: ${result.submissionId || data.submissionId}`, "success", 5200);
      await exportPdf(data, { silentValidation: true, suffix: result.submissionId || data.submissionId });
      resetForm(false);
    } catch (error) {
      queueSubmission(data);
      showToast(`Koneksi/backend gagal. Data diamankan di antrean perangkat dan akan dikirim ulang otomatis. ${error.message}`, "error", 7000);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendToBackend(payload) {
    if (!CONFIG.apiUrl || CONFIG.apiUrl.includes("PASTE_YOUR")) throw new Error("URL Apps Script belum diatur di config.js.");
    const response = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function queueSubmission(data) {
    const queue = readJson(QUEUE_KEY, []);
    if (!queue.some(item => item.submissionId === data.submissionId)) queue.push(data);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-20)));
  }

  async function flushQueue() {
    if (!navigator.onLine || !CONFIG.apiUrl || CONFIG.apiUrl.includes("PASTE_YOUR")) return;
    const queue = readJson(QUEUE_KEY, []);
    if (!queue.length) return;
    const remaining = [];
    let sent = 0;
    for (const item of queue) {
      try {
        const result = await sendToBackend(item);
        if (!result.ok) throw new Error(result.message || "Gagal");
        sent += 1;
      } catch (_) {
        remaining.push(item);
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    if (sent) showToast(`${sent} checklist tertunda berhasil dikirim.`, "success");
  }

  function saveDraft(showMessage = false) {
    const draft = collectData();
    draft.submissionId = "";
    draft.savedAt = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    if (showMessage) showToast("Draft tersimpan di perangkat.", "success");
  }

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => saveDraft(false), 450);
  }

  function restoreDraft() {
    const draft = readJson(DRAFT_KEY, null);
    if (!draft) return;
    if (draft.executionDate) $("#executionDate").value = draft.executionDate;
    if (draft.executionTime) $("#executionTime").value = draft.executionTime;
    if (draft.picName) $("#picName").value = draft.picName;
    if (typeof draft.declarationAccepted === "boolean") $("#declaration").checked = draft.declarationAccepted;

    (draft.tasks || []).forEach(task => {
      const radio = document.querySelector(`input[name="answer-${task.id}"][value="${task.answer}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const note = $(`#note-${task.id}`);
      if (note) note.value = task.note || "";
    });

    signatureRoles.forEach(role => {
      const sig = draft.signatures?.[role.id];
      if (!sig) return;
      $(`#name-${role.id}`).value = sig.name || "";
      if (sig.image) loadSignatureImage(role.id, sig.image);
    });
    showToast("Draft sebelumnya dipulihkan.");
  }

  function confirmReset() {
    const dialog = $("#confirmDialog");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      dialog.addEventListener("close", () => {
        if (dialog.returnValue === "confirm") resetForm(true);
      }, { once: true });
    } else if (window.confirm("Reset semua isian dan hapus draft?")) {
      resetForm(true);
    }
  }

  function resetForm(clearDraft = true) {
    $("#checklistForm").reset();
    signatureRoles.forEach(role => signaturePads.get(role.id)?.clear());
    $$(".task-row").forEach(row => row.classList.remove("has-answer", "answer-no"));
    clearInvalidStates();
    setDefaultDateTime();
    updateProgress();
    if (clearDraft) localStorage.removeItem(DRAFT_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function exportPdf(inputData, options = {}) {
    const data = inputData?.tasks ? inputData : collectData();
    if (!options.silentValidation) {
      const errors = validate(data, { requireSignatures: false }).filter(error => !error.includes("belum dijawab"));
      if (!data.executionDate || !data.picName) {
        showToast(errors[0] || "Isi tanggal dan PIC sebelum export PDF.", "error");
        return;
      }
    }

    const pdfReady = typeof window.ensurePdfLibraries === "function"
      ? await window.ensurePdfLibraries()
      : Boolean(window.jspdf?.jsPDF && window.jspdf.jsPDF.API?.autoTable);

    if (!pdfReady) {
      if (options.silentValidation) {
        showToast("Checklist tersimpan, tetapi PDF belum dibuat otomatis. Tekan Export PDF lalu pilih Simpan sebagai PDF.", "error", 6500);
        return;
      }
      exportWithPrintDialog(data);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(`FORM CHECKLIST ${FORM.label.toUpperCase()}`, pageWidth / 2, 16, { align: "center" });
    doc.setFontSize(11);
    doc.text(data.store || "Alam Sutera", pageWidth / 2, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Tanggal: ${formatDateId(data.executionDate)}`, 14, 31);
    doc.text(`${FORM.timeLabel}: ${data.executionTime || "-"}`, 14, 36);
    doc.text(`${FORM.picLabel}: ${data.picName || "-"}`, 105, 31);
    doc.text(`Status: ${data.summary.overallStatus}`, 105, 36);

    const body = data.tasks.map(task => [
      task.code,
      task.text,
      task.answer ? task.answer.toUpperCase() : "-",
      task.note || "-"
    ]);

    doc.autoTable({
      startY: 42,
      head: [["No", "To Do", "Jawaban", "Keterangan"]],
      body,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7.6, cellPadding: 2.2, valign: "top" },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 98 }, 2: { cellWidth: 22, halign: "center" }, 3: { cellWidth: 50 } },
      didDrawPage: hookData => {
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`Submission ID: ${data.submissionId || "DRAFT"}`, 14, doc.internal.pageSize.getHeight() - 7);
        doc.text(`Halaman ${hookData.pageNumber}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });
      }
    });

    let y = doc.lastAutoTable.finalY + 8;
    if (y > 245) { doc.addPage(); y = 18; }
    doc.setTextColor(23, 33, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Verifikasi", 14, y);
    y += 5;

    const cardWidth = 43;
    const gap = 4;
    signatureRoles.forEach((role, index) => {
      const x = 14 + index * (cardWidth + gap);
      const sig = data.signatures[role.id] || {};
      doc.setDrawColor(210);
      doc.rect(x, y, cardWidth, 31);
      if (sig.image) {
        try { doc.addImage(sig.image, "PNG", x + 2, y + 2, cardWidth - 4, 18, undefined, "FAST"); } catch (_) {}
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.4);
      doc.text(sig.name || "Belum diisi", x + cardWidth / 2, y + 23, { align: "center", maxWidth: cardWidth - 3 });
      doc.setFont("helvetica", "bold");
      doc.text(role.label, x + cardWidth / 2, y + 28, { align: "center" });
    });

    const fileSuffix = options.suffix || data.submissionId || "draft";
    const filename = `${FORM.label}_Checklist_${safeFilename(data.executionDate || "tanggal")}_${safeFilename(fileSuffix)}.pdf`;
    doc.save(filename);
    if (!options.silentValidation) showToast("PDF berhasil dibuat.", "success");
  }

  function exportWithPrintDialog(data) {
    const existing = document.getElementById("pdf-print-frame");
    existing?.remove();

    const frame = document.createElement("iframe");
    frame.id = "pdf-print-frame";
    frame.title = "Preview laporan PDF";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";

    const taskRows = data.tasks.map(task => `
      <tr>
        <td class="code">${escapeHtml(task.code)}</td>
        <td>
          <strong>${escapeHtml(task.text)}</strong>
          <small>${escapeHtml(task.textEn || "")}</small>
        </td>
        <td class="answer ${task.answer === "no" ? "no" : "yes"}">${escapeHtml(task.answer ? task.answer.toUpperCase() : "-")}</td>
        <td>${escapeHtml(task.note || "-")}</td>
      </tr>
    `).join("");

    const signatureCards = signatureRoles.map(role => {
      const signature = data.signatures?.[role.id] || {};
      const image = typeof signature.image === "string" && signature.image.startsWith("data:image/")
        ? `<img src="${signature.image}" alt="Tanda tangan ${escapeHtml(role.label)}">`
        : `<div class="signature-empty"></div>`;
      return `
        <div class="signature-card-print">
          ${image}
          <div class="signature-name-print">${escapeHtml(signature.name || "Belum diisi")}</div>
          <strong>${escapeHtml(role.label)}</strong>
        </div>
      `;
    }).join("");

    const reportHtml = `<!doctype html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${FORM.label} Checklist ${escapeHtml(data.executionDate || "")}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #17211f; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; }
          h1 { margin: 0; text-align: center; font-size: 17pt; }
          .store { margin: 3px 0 14px; text-align: center; font-size: 11pt; font-weight: 700; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 18px; margin-bottom: 10px; }
          .meta div { border-bottom: 1px solid #b9c4c1; padding: 4px 0; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #8f9b98; padding: 5px; vertical-align: top; overflow-wrap: anywhere; }
          th { background: #0f766e; color: white; font-size: 8pt; }
          th:nth-child(1), td.code { width: 8%; text-align: center; }
          th:nth-child(2) { width: 52%; }
          th:nth-child(3) { width: 12%; }
          th:nth-child(4) { width: 28%; }
          td small { display: block; margin-top: 3px; color: #5f6b68; font-size: 7.5pt; line-height: 1.3; }
          td.answer { text-align: center; font-weight: 700; }
          td.answer.no { color: #a3231d; }
          .verification { margin-top: 11px; font-size: 11pt; }
          .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 6px; }
          .signature-card-print { min-height: 37mm; border: 1px solid #aab5b2; padding: 5px; text-align: center; break-inside: avoid; }
          .signature-card-print img, .signature-empty { display: block; width: 100%; height: 22mm; object-fit: contain; }
          .signature-name-print { min-height: 15px; margin: 2px 0; }
          .footer { margin-top: 9px; display: flex; justify-content: space-between; color: #5f6b68; font-size: 7.5pt; }
          tr, .meta, .signature-card-print { break-inside: avoid; }
        </style>
      </head>
      <body>
        <h1>FORM CHECKLIST ${FORM.label.toUpperCase()}</h1>
        <div class="store">${escapeHtml(data.store || "Alam Sutera")}</div>
        <div class="meta">
          <div><strong>Tanggal:</strong> ${escapeHtml(formatDateId(data.executionDate))}</div>
          <div><strong>${escapeHtml(FORM.picLabel)}:</strong> ${escapeHtml(data.picName || "-")}</div>
          <div><strong>${escapeHtml(FORM.timeLabel)}:</strong> ${escapeHtml(data.executionTime || "-")}</div>
          <div><strong>Status:</strong> ${escapeHtml(data.summary?.overallStatus || "-")}</div>
        </div>
        <table>
          <thead><tr><th>No</th><th>To Do</th><th>Jawaban</th><th>Keterangan</th></tr></thead>
          <tbody>${taskRows}</tbody>
        </table>
        <h2 class="verification">Verifikasi</h2>
        <div class="signatures">${signatureCards}</div>
        <div class="footer">
          <span>Submission ID: ${escapeHtml(data.submissionId || "DRAFT")}</span>
          <span>Dicetak: ${escapeHtml(new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date()))}</span>
        </div>
      </body>
      </html>`;

    frame.onload = () => {
      window.setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          showToast("Pilih printer 'Save as PDF' atau 'Simpan sebagai PDF'.", "success", 6500);
        } catch (_) {
          showToast("Preview PDF gagal dibuka. Izinkan dialog cetak pada browser lalu coba lagi.", "error", 6500);
        }
      }, 250);
      window.setTimeout(() => frame.remove(), 60000);
    };

    document.body.appendChild(frame);
    frame.srcdoc = reportHtml;
  }

  function updateProgress() {
    const answered = allTasks.filter(task => document.querySelector(`input[name="answer-${task.id}"]:checked`)).length;
    const percent = Math.round((answered / allTasks.length) * 100);
    $("#progressText").textContent = `${answered} dari ${allTasks.length} langkah`;
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressBar").style.width = `${percent}%`;
  }

  function updateNetworkStatus() {
    const chip = $("#networkChip");
    const online = navigator.onLine;
    chip.textContent = online ? "Online" : "Offline";
    chip.classList.toggle("offline", !online);
  }

  function setSubmitting(value) {
    const button = $("#submitButton");
    button.disabled = value;
    button.classList.toggle("loading", value);
    button.querySelector(".button-label").textContent = value ? "Mengirim..." : "Kirim checklist";
  }

  function focusFirstInvalid() {
    const invalid = $(".invalid, .invalid-card");
    invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showToast(message, type = "", duration = 3600) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`.trim();
    toast.textContent = message;
    $("#toastRegion").appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function createSubmissionId() {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    return `ALS-${FORM.code}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `DEV-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  function localDate(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function formatDateId(value) {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
  }

  function safeFilename(value) { return String(value).replace(/[^a-z0-9_-]+/gi, "-").replace(/-+/g, "-"); }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } }
  function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }

  document.addEventListener("DOMContentLoaded", init);
})();

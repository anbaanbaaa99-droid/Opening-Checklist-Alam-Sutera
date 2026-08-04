(() => {
  "use strict";

  const JSPDF_SOURCES = [
    "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js"
  ];

  const AUTOTABLE_SOURCES = [
    "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js",
    "https://unpkg.com/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js"
  ];

  let loadingPromise = null;

  function hasJsPdf() {
    return Boolean(window.jspdf && typeof window.jspdf.jsPDF === "function");
  }

  function hasAutoTable() {
    return hasJsPdf() && typeof window.jspdf.jsPDF.API?.autoTable === "function";
  }

  function loadScript(url, test, timeoutMs = 9000) {
    return new Promise(resolve => {
      if (test()) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      let finished = false;
      const finish = success => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (!success) script.remove();
        resolve(success);
      };

      script.src = url;
      script.async = true;
      script.dataset.pdfDependency = "true";
      script.onload = () => finish(test());
      script.onerror = () => finish(false);
      const timer = setTimeout(() => finish(false), timeoutMs);
      document.head.appendChild(script);
    });
  }

  async function loadFirstWorking(sources, test) {
    for (const source of sources) {
      if (await loadScript(source, test)) return true;
    }
    return false;
  }

  window.ensurePdfLibraries = function ensurePdfLibraries() {
    if (hasAutoTable()) return Promise.resolve(true);
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      if (!hasJsPdf() && !(await loadFirstWorking(JSPDF_SOURCES, hasJsPdf))) return false;
      if (!hasAutoTable() && !(await loadFirstWorking(AUTOTABLE_SOURCES, hasAutoTable))) return false;
      return hasAutoTable();
    })().finally(() => {
      loadingPromise = null;
    });

    return loadingPromise;
  };
})();

importScripts('xlsx.full.min.js');

self.onmessage = (e) => {
  try {
    const wb = XLSX.read(e.data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    self.postMessage({ ok: true, rows });
  } catch (err) {
    self.postMessage({ ok: false, error: err.message });
  }
};

/**
 * 네트워크 장치 대시보드
 * - 샘플 장치 데이터 렌더링
 * - @Network-IP-Search: IP 열 부분 일치 필터
 */

/** XSS 방지 */
function escapeHtml(text) {
  if (text == null) return "";
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML;
}

/** 데모용 장치 목록 (정적) */
const demoDevices = [
  { online: true, ip: "192.168.0.1", mac: "AA:BB:CC:DD:EE:01", vendor: "알 수 없음", ports: "22, 80, 443", model: "", serial: "", hostname: "gateway.lan", lastSeen: "2024-04-11T12:35:17" },
  { online: true, ip: "192.168.0.2", mac: "AA:BB:CC:DD:EE:02", vendor: "알 수 없음", ports: "5353", model: "", serial: "", hostname: "printer.lan", lastSeen: "2024-04-11T12:34:02" },
  { online: false, ip: "192.168.0.15", mac: "AA:BB:CC:DD:EE:0F", vendor: "알 수 없음", ports: "-", model: "", serial: "", hostname: "-", lastSeen: "2024-04-10T08:12:00" },
  { online: true, ip: "192.168.0.101", mac: "AA:BB:CC:DD:EE:65", vendor: "알 수 없음", ports: "445, 3389", model: "", serial: "", hostname: "pc-01", lastSeen: "2024-04-11T12:35:10" },
];

let trendHistory = [];

function normalizeIpQuery(raw) {
  return String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * @Network-IP-Search: 검색어가 IP 문자열에 포함되는지 검사
 */
function deviceMatchesIpSearch(device, queryNormalized) {
  if (!queryNormalized) return true;
  const ip = String(device.ip || "").toLowerCase();
  return ip.includes(queryNormalized);
}

function renderDeviceRow(device) {
  const tr = document.createElement("tr");
  tr.dataset.ip = escapeHtml(device.ip);
  const statusClass = device.online ? "pill pill-on" : "pill pill-off";
  const statusText = device.online ? "온라인" : "오프라인";
  const dash = (v) => (v && String(v).trim()) ? escapeHtml(v) : "-";

  tr.innerHTML = `
    <td><span class="${statusClass}">${statusText}</span></td>
    <td class="cell-ip">${escapeHtml(device.ip)}</td>
    <td>${dash(device.mac)}</td>
    <td>${dash(device.vendor)}</td>
    <td>${dash(device.ports)}</td>
    <td>${dash(device.model)}</td>
    <td>${dash(device.serial)}</td>
    <td>${dash(device.hostname)}</td>
    <td>${dash(device.lastSeen)}</td>`;
  return tr;
}

function updateCounts(devices) {
  const online = devices.filter((d) => d.online).length;
  const offline = devices.length - online;
  const oEl = document.getElementById("count-online");
  const fEl = document.getElementById("count-offline");
  const tEl = document.getElementById("count-total");
  if (oEl) oEl.textContent = String(online);
  if (fEl) fEl.textContent = String(offline);
  if (tEl) tEl.textContent = String(devices.length);
}

function drawTrendChart(canvas, history) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 20 + (i * (h - 40) / 4);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
  }
  if (history.length < 2) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "12px sans-serif";
    ctx.fillText("스캔 후 추이가 쌓입니다", 48, h / 2);
    return;
  }
  const maxT = Math.max(...history.map((h) => h.total), 1);

  function lineSeries(key, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = 40 + (i / (history.length - 1)) * (w - 50);
      const y = h - 20 - (pt[key] / maxT) * (h - 40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  lineSeries("online", "#34d399");
  lineSeries("offline", "#f87171");
  lineSeries("total", "#60a5fa");
}

function pushTrendSnapshot(devices) {
  const online = devices.filter((d) => d.online).length;
  trendHistory.push({
    t: Date.now(),
    online,
    offline: devices.length - online,
    total: devices.length,
  });
  if (trendHistory.length > 24) trendHistory = trendHistory.slice(-24);
}

function renderCollectStats() {
  const el = document.getElementById("collect-stats");
  if (!el) return;
  el.innerHTML = `
    <div class="stat-grid">
      <div><span class="stat-lbl">대상(온라인)</span><strong>—</strong></div>
      <div><span class="stat-lbl">성공</span><strong>—</strong></div>
      <div><span class="stat-lbl">실패</span><strong>—</strong></div>
      <div><span class="stat-lbl">성공률</span><strong>—</strong></div>
    </div>`;
}

function renderSysInfo() {
  const el = document.getElementById("dash-sys-info");
  if (!el) return;
  const now = new Date().toISOString().slice(0, 19).replace("T", "T");
  el.innerHTML = `
    <span>로컬 IP: <code>192.168.0.0/24</code></span>
    <span>마지막 스캔: <time datetime="${now}">${now}</time></span>`;
}

/**
 * 장치 테이블 갱신 + @Network-IP-Search 필터 적용
 */
function refreshDeviceTable(allDevices, ipQueryNormalized) {
  const tbody = document.getElementById("device-tbody");
  const emptyMsg = document.getElementById("table-empty-msg");
  if (!tbody) return;

  const filtered = allDevices.filter((d) => deviceMatchesIpSearch(d, ipQueryNormalized));
  tbody.innerHTML = "";
  filtered.forEach((d) => tbody.appendChild(renderDeviceRow(d)));

  if (emptyMsg) {
    emptyMsg.hidden = filtered.length > 0;
  }
  updateCounts(allDevices);
}

function downloadCsv(rows) {
  const header = ["status", "ip", "mac", "vendor", "ports", "model", "serial", "hostname", "lastSeen"];
  const lines = [header.join(",")];
  rows.forEach((d) => {
    const status = d.online ? "online" : "offline";
    lines.push(
      [status, d.ip, d.mac, d.vendor, d.ports, d.model, d.serial, d.hostname, d.lastSeen]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    );
  });
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "devices-export.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function initNetworkIpSearch(allDevicesRef) {
  const input = document.getElementById("network-ip-search-input");
  if (!input) return;

  const apply = () => {
    const q = normalizeIpQuery(input.value);
    refreshDeviceTable(allDevicesRef.list, q);
    const canvas = document.getElementById("trend-chart");
    drawTrendChart(canvas, trendHistory);
  };

  input.addEventListener("input", apply);
  input.addEventListener("search", apply);
}

function initDashboard() {
  const devices = { list: [...demoDevices] };
  renderSysInfo();
  renderCollectStats();
  pushTrendSnapshot(devices.list);
  refreshDeviceTable(devices.list, "");

  const canvas = document.getElementById("trend-chart");
  drawTrendChart(canvas, trendHistory);

  initNetworkIpSearch(devices);

  document.getElementById("btn-rescan")?.addEventListener("click", () => {
    renderSysInfo();
    pushTrendSnapshot(devices.list);
    drawTrendChart(canvas, trendHistory);
    const q = normalizeIpQuery(document.getElementById("network-ip-search-input")?.value);
    refreshDeviceTable(devices.list, q);
  });

  document.getElementById("btn-csv")?.addEventListener("click", () => {
    const q = normalizeIpQuery(document.getElementById("network-ip-search-input")?.value);
    const rows = devices.list.filter((d) => deviceMatchesIpSearch(d, q));
    if (rows.length === 0) return;
    downloadCsv(rows);
  });

  document.getElementById("btn-info")?.addEventListener("click", () => {
    const fr = document.getElementById("failure-reasons");
    if (fr) fr.textContent = "데모 모드: 실제 SNMP/HTTP 수집은 백엔드 연동 시 표시됩니다.";
  });
}

document.addEventListener("DOMContentLoaded", initDashboard);

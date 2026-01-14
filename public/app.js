const $ = (sel) => document.querySelector(sel);

const storeListEl = $("#storeList");
const storeHeaderEl = $("#storeHeader");
const menuListEl = $("#menuList");
const qEl = $("#q");

const kminEl = $("#kmin");
const kmaxEl = $("#kmax");

// storeId -> menus[]
const menusCache = new Map();

let stores = [];
let selectedId = null;

let map = null;
let marker = null;
let infoWindow = null;
let geocoder = null;


function pickDongFromGeocode(item) {
  const dong =
    item?.address?.region_3depth_name ||
    item?.road_address?.region_3depth_name ||
    "";
  return dong;
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function formatK(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

// Kakao SDK load 보장
function kakaoReady() {
  return new Promise((resolve, reject) => {
    let retry = 0;
    const check = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => resolve());
        return;
      }
      if (retry++ > 100) return reject(new Error("Kakao Maps SDK not loaded"));
      setTimeout(check, 50);
    };
    check();
  });
}

async function initMap() {
  await kakaoReady();

  const container = document.getElementById("map");
  if (!container) return;

  if (!map) {
    const center = new kakao.maps.LatLng(36.480, 127.289);
    map = new kakao.maps.Map(container, { center, level: 5 });

    marker = new kakao.maps.Marker({ position: center });
    marker.setMap(map);

    infoWindow = new kakao.maps.InfoWindow({ zIndex: 3 });
    geocoder = new kakao.maps.services.Geocoder();
  }
}

function cleanAddress(addr) {
  if (!addr) return "";
  return addr.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, " ").trim();
}

async function showStoreOnMap(store) {
  await initMap();

  const addr = cleanAddress(store.address);
  if (!addr) return { dong: "" };

  return new Promise((resolve) => {
    geocoder.addressSearch(addr, function (result, status) {
      if (status !== kakao.maps.services.Status.OK || !result?.length) {
        console.warn("주소 검색 실패:", addr, status, result);
        resolve({ dong: "" });
        return;
      }

      const item = result[0];
      const { x, y } = item; // x=경도, y=위도
      const pos = new kakao.maps.LatLng(Number(y), Number(x));

      map.setCenter(pos);
      marker.setPosition(pos);

      infoWindow.setContent(
        `<div style="padding:6px 10px;font-size:13px;">${store.name}</div>`
      );
      infoWindow.open(map, marker);

      const dong = pickDongFromGeocode(item);
      resolve({ dong });
    });
  });
}

async function geocodeDongByAddress(address) {
  await initMap();
  const addr = cleanAddress(address);
  if (!addr) return "";

  return new Promise((resolve) => {
    geocoder.addressSearch(addr, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || !result?.length) {
        resolve("");
        return;
      }
      resolve(pickDongFromGeocode(result[0]) || "");
    });
  });
}

let renderToken = 0; // 입력이 빠르게 바뀔 때 이전 렌더 무효화용

async function renderStoreList() {
  const token = ++renderToken;

  const q = (qEl?.value || "").trim().toLowerCase();

  const kminRaw = (kminEl?.value || "").trim();
  const kmaxRaw = (kmaxEl?.value || "").trim();

  const hasMin = kminRaw !== "";
  const hasMax = kmaxRaw !== "";

  const kmin = hasMin ? Number(kminRaw) : null;
  const kmax = hasMax ? Number(kmaxRaw) : null;

  // 1) 먼저 텍스트 검색으로 후보 좁히기 (성능)
  const textFiltered = stores.filter((s) => {
    const name = (s.name || "").toLowerCase();
    const addr = (s.address || "").toLowerCase();
    return !q || name.includes(q) || addr.includes(q);
  });

  // 2) kcal 필터가 없으면 그대로 렌더
  if (!hasMin && !hasMax) {
    if (token !== renderToken) return;
    paintStoreList(textFiltered, null);
    return;
  }

  // 3) kcal 필터가 있으면, 각 가게의 "대표메뉴 kcal"를 보고 통과 여부 판단
  const passed = [];
  const matchedRepMenusByStoreId = new Map(); // storeId -> 매칭된 대표메뉴들(선택적으로 UI에 보여줄 수 있음)

  for (const s of textFiltered) {
    // 입력이 바뀌면 즉시 중단
    if (token !== renderToken) return;

    const menus = await getMenusByStoreId(s.id);
    const reps = getRepresentativeMenus(menus);

    const matched = reps.filter((m) =>
      inRange(Number(m.kcal), kmin, kmax, hasMin, hasMax)
    );

    if (matched.length > 0) {
      passed.push(s);
      matchedRepMenusByStoreId.set(s.id, matched);
    }
  }

  if (token !== renderToken) return;
  paintStoreList(passed, matchedRepMenusByStoreId);
}

function paintStoreList(list, matchedRepMenusByStoreId) {
  storeListEl.innerHTML = "";

  list.forEach((s) => {
    const card = document.createElement("div");
    const dong = s.dong || "";

    const matched = matchedRepMenusByStoreId?.get(s.id) || null;

    // 대표메뉴 매칭된 kcal를 간단히 표시(원치 않으면 이 블록 삭제)
    const matchedText = matched
      ? `<div class="muted">✅ 대표메뉴 매칭: ${matched
          .map((m) => `${m.name}(${m.kcal}kcal)`)
          .join(", ")}</div>`
      : "";

    card.className = "storeCard" + (s.id === selectedId ? " active" : "");
    card.innerHTML = `
      <div class="storeTop">
        <div class="storeName">${s.name}</div>
        <span class="badge">${s.tag}</span>
      </div>
      <div class="muted">★ ${s.rating} (${formatK(s.reviews)})</div>
      <div class="muted addrLine">
        <span>📍 ${s.address}</span>
        ${dong ? `<span class="dongPill">${dong}</span>` : ""}
      </div>
      ${matchedText}
    `;

    card.addEventListener("click", () => selectStore(s.id));
    storeListEl.appendChild(card);
  });
}
  storeListEl.innerHTML = "";

  filtered.forEach((s) => {
    const card = document.createElement("div");
    const dong = s.dong || "";

    card.className = "storeCard" + (s.id === selectedId ? " active" : "");
    card.innerHTML = `
      <div class="storeTop">
        <div class="storeName">${s.name}</div>
        <span class="badge">${s.tag}</span>
      </div>
      <div class="muted">★ ${s.rating} (${formatK(s.reviews)})${
        s.kcalAvg ? ` · ${s.kcalAvg} kcal` : ""
      }</div>
      <div class="muted addrLine">
        <span>📍 ${s.address}</span>
        ${dong ? `<span class="dongPill">${dong}</span>` : ""}
      </div>
    `;

    card.addEventListener("click", () => selectStore(s.id));
    storeListEl.appendChild(card);
  });


async function selectStore(id) {
  selectedId = id;
  renderStoreList();

  storeHeaderEl.innerHTML =
    `<h2>불러오는 중...</h2><p class="muted">데이터를 가져오고 있어요.</p>`;
  menuListEl.innerHTML = "";

  const store = await fetchJSON(`/api/stores/${id}`);
  const { dong } = await showStoreOnMap(store);

  // stores 캐시에 dong 반영
  const idx = stores.findIndex((s) => s.id === store.id);
  if (idx !== -1) stores[idx].dong = dong;
  store.dong = dong;

  renderStoreList();

  const menuRes = await fetchJSON(`/api/stores/${id}/menus`);
  const menus = menuRes.items || [];

  storeHeaderEl.innerHTML = `
    <h2>${store.name}</h2>
    <div class="storeMeta">
      <span class="badge">${store.tag}</span>
      <span>★ ${store.rating} (${formatK(store.reviews)})</span>
      ${store.kcalAvg ? `<span><b>${store.kcalAvg}</b> kcal</span>` : ""}
    </div>
    <p class="muted addrLine">
      <span>📍 ${store.address}</span>
      ${store.dong ? `<span class="dongPill">${store.dong}</span>` : ""}
    </p>
  `;

  if (menus.length === 0) {
    menuListEl.innerHTML = `<p class="muted">등록된 메뉴가 없습니다.</p>`;
    return;
  }

  menuListEl.innerHTML = "";
  menus.forEach((m) => {
    const row = document.createElement("div");
    row.className = "menuItem";
    row.innerHTML = `
      <div>
        <b>${m.name}</b>
        <div class="menuSub">
          <span><b>${m.kcal}</b> kcal</span>
          <span>단백질 ${m.protein}g</span>
          <span>당 ${m.sugar}g</span>
          <span>나트륨 ${m.sodium}mg</span>
        </div>
      </div>
      <div class="grade ${m.grade}">${m.grade}등급</div>
    `;
    menuListEl.appendChild(row);
  });
}

async function init() {
  const data = await fetchJSON("/api/stores");
  stores = (data.items || []).map((s) => ({ ...s, dong: "" }));

  renderStoreList();
  await initMap();

  // dong 프리패치(느리면 주석해도 됨)
  for (let i = 0; i < stores.length; i++) {
    const s = stores[i];
    if (s.dong) continue;

    const dong = await geocodeDongByAddress(s.address);
    s.dong = dong;

    if (i % 3 === 0) renderStoreList();
  }

  renderStoreList();
}

qEl?.addEventListener("input", renderStoreList);
kminEl?.addEventListener("input", renderStoreList);
kmaxEl?.addEventListener("input", renderStoreList);

init();

async function getMenusByStoreId(id) {
  if (menusCache.has(id)) return menusCache.get(id);

  const res = await fetchJSON(`/api/stores/${id}/menus`);
  const menus = res.items || [];
  menusCache.set(id, menus);
  return menus;
}

function inRange(kcal, kmin, kmax, hasMin, hasMax) {
  if (!Number.isFinite(kcal)) return false;
  if (hasMin && kcal < kmin) return false;
  if (hasMax && kcal > kmax) return false;
  return true;
}

function getRepresentativeMenus(menus) {
  // 현재 mock 데이터는 대표메뉴 1~3이 앞쪽에 있다는 가정
  // 실제로는 m.isRepresentative 같은 플래그가 있으면 그걸로 필터하는 게 베스트
  return (menus || []).slice(0, 3);
}
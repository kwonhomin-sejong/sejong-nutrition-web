const $ = (sel) => document.querySelector(sel);

const storeListEl = $("#storeList");
const storeHeaderEl = $("#storeHeader");
const menuListEl = $("#menuList");
const qEl = $("#q");

//const kcalMinEl = $("#kcalMin");
//const kcalMaxEl = $("#kcalMax");

const kminEl = document.querySelector("#kmin");
const kmaxEl = document.querySelector("#kmax");

//const kminEl = $("#kmin");
//const kmaxEl = $("#kmax");

let stores = [];
let selectedId = null;

let map = null;
let marker = null;
let infoWindow = null;

let geocoder = null; // 추가

function pickDongFromGeocode(item) {
  // address(지번) 쪽이 행정구역 정보가 더 잘 들어오는 편
  const dong =
    item?.address?.region_3depth_name ||
    item?.road_address?.region_3depth_name ||
    "";
  return dong;
}

async function fetchJSON(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

function formatK(n){
  if (n >= 1000) return (n/1000).toFixed(1) + "k";
  return String(n);
}

/*function kakaoReady() {
  return new Promise((resolve, reject) => {
    if (!window.kakao || !window.kakao.maps) {
      reject(new Error("Kakao Maps SDK not loaded"));
      return;
    }
    window.kakao.maps.load(() => resolve());
  });
}*/ 

function kakaoReady() {
  return new Promise((resolve, reject) => {
    let retry = 0;

    const check = () => {
      if (window.kakao && window.kakao.maps) {
        // autoload=false인 경우 maps.load로 실제 초기화
        window.kakao.maps.load(() => resolve());
        return;
      }
      if (retry++ > 100) return reject(new Error("Kakao Maps SDK not loaded"));
      setTimeout(check, 50);
    };

    check();
  });
}

async function renderMap(lat, lng, title) {
  await kakaoReady();

  const container = document.getElementById("map");
  if (!container) return;

  const center = new kakao.maps.LatLng(lat, lng);

  // ✅ 최초 1회만 지도 생성
  if (!map) {
    map = new kakao.maps.Map(container, { center, level: 4 });
    marker = new kakao.maps.Marker({ position: center });
    marker.setMap(map);
    infoWindow = new kakao.maps.InfoWindow({ removable: true });
  }

  // ✅ 클릭할 때마다 지도 이동/마커 이동
  map.setCenter(center);
  marker.setPosition(center);

  // ✅ 인포윈도우(가게명)
  infoWindow.setContent(
    `<div style="padding:6px 10px;font-size:12px;">${title}</div>`
  );
  infoWindow.open(map, marker);
}

function renderStoreList(){
   const q = qEl.value.trim().toLowerCase();

  const kmin = Number(kminEl.value);
  const kmax = Number(kmaxEl.value);

  const hasMin = kminEl.value !== "";
  const hasMax = kmaxEl.value !== "";

  const filtered = stores.filter(s => {
    const matchText =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q);

    const kcal = Number(s.kcalAvg) || 0;

    const matchMin = !hasMin || kcal >= kmin;
    const matchMax = !hasMax || kcal <= kmax;

    return matchText && matchMin && matchMax;
  });

  storeListEl.innerHTML = "";
  filtered.forEach(s => {
    const card = document.createElement("div");
    const dong = s.dong || "";
    card.className = "storeCard" + (s.id === selectedId ? " active" : "");
    card.innerHTML = `
      <div class="storeTop">
        <div class="storeName">${s.name}</div>
        <span class="badge">${s.tag}</span>
      </div>
      <div class="muted">★ ${s.rating} (${formatK(s.reviews)}) · ${s.kcalAvg} kcal</div>
      <div class="muted addrLine">
        <span>📍 ${s.address}</span>
        ${dong ? `<span class="dongPill">${dong}</span>` : ""}
      </div>
    `;
    card.addEventListener("click", () => selectStore(s.id));
    storeListEl.appendChild(card);
  });
}


  storeListEl.innerHTML = "";
  filtered.forEach(s => {
    const card = document.createElement("div");
    const dong = s.dong || "";
    const stat = getStoreKcalStat(s.id); // 메뉴 기반 kcal 표시도 가능

    card.className = "storeCard" + (s.id === selectedId ? " active" : "");
    card.innerHTML = `
      <div class="storeTop">
        <div class="storeName">${s.name}</div>
        <span class="badge">${s.tag}</span>
      </div>

      <div class="muted">
        ★ ${s.rating} (${formatK(s.reviews)}) · ${stat.avg ?? s.kcalAvg} kcal
      </div>

      <div class="muted addrLine">
        <span>📍 ${s.address}</span>
        ${dong ? `<span class="dongPill">${dong}</span>` : ""}
      </div>
    `;
    card.addEventListener("click", () => selectStore(s.id));
    storeListEl.appendChild(card);
  });


async function selectStore(id){
  selectedId = id;
  renderStoreList();

  storeHeaderEl.innerHTML = `<h2>불러오는 중...</h2><p class="muted">데이터를 가져오고 있어요.</p>`;
  menuListEl.innerHTML = "";

  const store = await fetchJSON(`/api/stores/${id}`);
  /*await renderMap(store.lat, store.lng, store.name);*/
  /*await showStoreOnMap(store);*/
  const { dong } = await showStoreOnMap(store);

  // ✅ stores 배열에도 캐시(왼쪽 리스트에 바로 반영되게)
  const idx = stores.findIndex(s => s.id === store.id);
  if (idx !== -1) stores[idx].dong = dong;

  // ✅ 선택된 store에도 달아두기
  store.dong = dong;

  renderStoreList();
  const menuRes = await fetchJSON(`/api/stores/${id}/menus`);
  const menus = menuRes.items || [];

  storeHeaderEl.innerHTML = `
    <h2>${store.name}</h2>
    <div class="storeMeta">
      <span class="badge">${store.tag}</span>
      <span>★ ${store.rating} (${formatK(store.reviews)})</span>
      <span><b>${store.kcalAvg}</b> kcal</span>
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
  menus.forEach(m => {
    const row = document.createElement("div");
    row.className = "menuItem";
    row.innerHTML = `
      <div>
        <b>${m.name}</b>
        <div class="menuSub">
          <span><b>${m.kcal}</b> kcal</span>
          <span>단 ${m.protein}g</span>
          <span>당 ${m.sugar}g</span>
          <span>나 ${m.sodium}mg</span>
        </div>
      </div>
      <div class="grade ${m.grade}">${m.grade}등급</div>
    `;
    menuListEl.appendChild(row);
  });
}

async function init(){
  const data = await fetchJSON("/api/stores");
  stores = data.items.map(s => ({ ...s, dong: "" }));

  // 1) 먼저 화면부터 그리기
  renderStoreList();

  // 2) 지도 SDK/지오코더 준비
  await initMap();

  // 3) dong 미리 채우기 (순차)
  for (let i = 0; i < stores.length; i++) {
    const s = stores[i];

    // 이미 있으면 스킵
    if (s.dong) continue;

    const dong = await geocodeDongByAddress(s.address);
    s.dong = dong;

    // 3~5개마다 한 번만 다시 그리기(성능)
    if (i % 3 === 0) renderStoreList();
  }
  renderStoreList();
}

qEl.addEventListener("input", renderStoreList);
kminEl.addEventListener("input", renderStoreList);
kmaxEl.addEventListener("input", renderStoreList);
init();

/*function initMap() {

  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(36.480, 127.289), // 세종시 대략 중심
    level: 5,
  };

  map = new kakao.maps.Map(container, options);

  marker = new kakao.maps.Marker();
  marker.setMap(map);

  geocoder = new kakao.maps.services.Geocoder();
  infoWindow = new kakao.maps.InfoWindow({ zIndex: 3 });
}*/

async function initMap() {
  await kakaoReady();

  const container = document.getElementById("map");
  if (!container) return;

  // 최초 1회만 생성
  if (!map) {
    const center = new kakao.maps.LatLng(36.480, 127.289); // 세종 중심
    map = new kakao.maps.Map(container, { center, level: 5 });

    marker = new kakao.maps.Marker({ position: center });
    marker.setMap(map);

    infoWindow = new kakao.maps.InfoWindow({ zIndex: 3 });

    geocoder = new kakao.maps.services.Geocoder(); // ⭐ 주소검색용
  }
}

function cleanAddress(addr) {
  if (!addr) return "";
  // [30104] 같은 우편번호/대괄호 제거 + 공백 정리
  return addr.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, " ").trim();
}

/*function showStoreOnMap(store) {
  const addr = cleanAddress(store.address);

  if (!addr) {
    alert("주소가 없어서 지도를 표시할 수 없어요.");
    return;
  }

  geocoder.addressSearch(addr, function (result, status) {
    if (status !== kakao.maps.services.Status.OK || !result?.length) {
      console.warn("주소 검색 실패:", addr, status, result);
      alert("주소를 찾을 수 없어요. 주소를 더 정확히 입력해 주세요.");
      return;
    }

    // ✅ 첫 번째 결과 사용(여러개면 보완 가능)
    const { x, y } = result[0]; // x=경도(lng), y=위도(lat)
    const pos = new kakao.maps.LatLng(Number(y), Number(x));

    map.setCenter(pos);
    marker.setPosition(pos);

    infoWindow.setContent(
      `<div style="padding:6px 10px;font-size:13px;">${store.name}</div>`
    );
    infoWindow.open(map, marker);
  });
}*/

/*async function showStoreOnMap(store) {
  await initMap(); // ✅ 지도/지오코더 준비 보장

  const addr = cleanAddress(store.address);
  if (!addr) {
    alert("주소가 없어서 지도를 표시할 수 없어요.");
    return;
  }

  geocoder.addressSearch(addr, function (result, status) {
    if (status !== kakao.maps.services.Status.OK || !result?.length) {
      console.warn("주소 검색 실패:", addr, status, result);
      alert("주소를 찾을 수 없어요. 주소를 더 정확히 입력해 주세요.");
      return;
    }

    // ✅ Kakao: x=경도(lng), y=위도(lat)
    const { x, y } = result[0];
    const pos = new kakao.maps.LatLng(Number(y), Number(x));

    map.setCenter(pos);
    marker.setPosition(pos);

    infoWindow.setContent(
      `<div style="padding:6px 10px;font-size:13px;">${store.name}</div>`);
    infoWindow.open(map, marker);
  });
}*/

async function showStoreOnMap(store) {
  await initMap();

  const addr = cleanAddress(store.address);
  if (!addr) {
    alert("주소가 없어서 지도를 표시할 수 없어요.");
    return { dong: "" };
  }

  return new Promise((resolve) => {
    geocoder.addressSearch(addr, function (result, status) {
      if (status !== kakao.maps.services.Status.OK || !result?.length) {
        console.warn("주소 검색 실패:", addr, status, result);
        alert("주소를 찾을 수 없어요. 주소를 더 정확히 입력해 주세요.");
        resolve({ dong: "" });
        return;
      }

      const item = result[0];

      // ✅ 좌표
      const { x, y } = item; // x=경도, y=위도
      const pos = new kakao.maps.LatLng(Number(y), Number(x));

      map.setCenter(pos);
      marker.setPosition(pos);

      infoWindow.setContent(
        `<div style="padding:6px 10px;font-size:13px;">${store.name}</div>`
      );
      infoWindow.open(map, marker);

      // ✅ 행정동(3depth) 뽑기
      const dong = pickDongFromGeocode(item);
      resolve({ dong });
    });
  });
}

async function geocodeDongByAddress(address) {
  await initMap(); // geocoder 준비용

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

function normalizeKcalRange(){
  const min = Number(kcalMinEl.value);
  const max = Number(kcalMaxEl.value);
  if (kcalMinEl.value !== "" && kcalMaxEl.value !== "" && min > max) {
    // min/max 스왑
    kcalMinEl.value = String(max);
    kcalMaxEl.value = String(min);
  }
}
kcalMinEl.addEventListener("change", () => { normalizeKcalRange(); renderStoreList(); });
kcalMaxEl.addEventListener("change", () => { normalizeKcalRange(); renderStoreList(); });

function getStoreKcalStat(storeId){
  const menus = menusByStoreId?.[storeId] || [];
  if (!menus.length) return { min: null, max: null, avg: null };

  const kcals = menus
    .map(m => Number(m.kcal))
    .filter(n => Number.isFinite(n));

  if (!kcals.length) return { min: null, max: null, avg: null };

  const min = Math.min(...kcals);
  const max = Math.max(...kcals);
  const avg = Math.round(kcals.reduce((a,b)=>a+b,0) / kcals.length);

  return { min, max, avg };
}
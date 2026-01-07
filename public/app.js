const $ = (sel) => document.querySelector(sel);

const storeListEl = $("#storeList");
const storeHeaderEl = $("#storeHeader");
const menuListEl = $("#menuList");
const qEl = $("#q");

let stores = [];
let selectedId = null;

let map = null;
let marker = null;
let infoWindow = null;

async function fetchJSON(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

function formatK(n){
  if (n >= 1000) return (n/1000).toFixed(1) + "k";
  return String(n);
}

function kakaoReady() {
  return new Promise((resolve, reject) => {
    if (!window.kakao || !window.kakao.maps) {
      reject(new Error("Kakao Maps SDK not loaded"));
      return;
    }
    window.kakao.maps.load(() => resolve());
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
  const filtered = stores.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
  );

  storeListEl.innerHTML = "";
  filtered.forEach(s => {
    const card = document.createElement("div");
    card.className = "storeCard" + (s.id === selectedId ? " active" : "");
    card.innerHTML = `
      <div class="storeTop">
        <div class="storeName">${s.name}</div>
        <span class="badge">${s.tag}</span>
      </div>
      <div class="muted">★ ${s.rating} (${formatK(s.reviews)}) · ${s.kcalAvg} kcal</div>
      <div class="muted">📍 ${s.address}</div>
    `;
    card.addEventListener("click", () => selectStore(s.id));
    storeListEl.appendChild(card);
  });
}

async function selectStore(id){
  selectedId = id;
  renderStoreList();

  // 기존: 우측 패널 메뉴 렌더링 ...
  renderStoreDetail(store);

  // ✅ 지도 갱신
  showStoreOnMap(store);

  storeHeaderEl.innerHTML = `<h2>불러오는 중...</h2><p class="muted">데이터를 가져오고 있어요.</p>`;
  menuListEl.innerHTML = "";

  const store = await fetchJSON(`/api/stores/${id}`);
  await renderMap(store.lat, store.lng, store.name);
  const menuRes = await fetchJSON(`/api/stores/${id}/menus`);
  const menus = menuRes.items || [];

  storeHeaderEl.innerHTML = `
    <h2>${store.name}</h2>
    <div class="storeMeta">
      <span class="badge">${store.tag}</span>
      <span>★ ${store.rating} (${formatK(store.reviews)})</span>
      <span><b>${store.kcalAvg}</b> kcal</span>
    </div>
    <p class="muted">📍 ${store.address}</p>
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
  stores = data.items;
  renderStoreList();
}

qEl.addEventListener("input", renderStoreList);
init();

function initMap() {
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
}

function cleanAddress(addr) {
  if (!addr) return "";
  // [30104] 같은 우편번호/대괄호 제거 + 공백 정리
  return addr.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, " ").trim();
}

function showStoreOnMap(store) {
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
}
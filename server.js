const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const XLSX = require("xlsx");
//const PORT = process.env.PORT || 3000;

// ----------------------
// 1) Mock Data (나중에 DB/외부API로 교체 가능)
// ----------------------
/*const stores = [
  { id: 1, name: "페리카나", tag: "일반음식점", rating: 4.5, reviews: 1200, kcalAvg: 588, address: "세종특별자치시 갈매로 479", lat: 36.4801, lng: 127.2602  },
  { id: 2, name: "두근돼지 김치찜", tag: "일반음식점", rating: 4.2, reviews: 310,  kcalAvg: 380, address: "세종특별자치시 노을3로 19 상가동 1층 126호" , lat: 36.4822, lng: 127.2581 },
  { id: 3, name: "와플스토리", tag: "일반음식점", rating: 4.3, reviews: 76,   kcalAvg: 760, address: "세종특별자치시 한누리대로 311",  lat: 36.4788, lng: 127.2655 },
  { id: 4, name: "착한양꼬치", tag: "일반음식점", rating: 4.3, reviews: 76,   kcalAvg: 760, address: "세종특별자치시 조치원읍 행복12길 11",  lat: 36.4789, lng: 127.2656 },
  { id: 5, name: "세종한우곱창", tag: "일반음식점", rating: 4.3, reviews: 76,   kcalAvg: 760, address: "세종특별자치시 나성로 133-15",  lat: 36.4790, lng: 127.2657 },
];*/

const menusByStoreId = {
  1: [
    { id: 101, name: "대표 메뉴 1", kcal: 500, protein: 50, sugar: 20, sodium: 800, grade: "B" },
    { id: 102, name: "대표 메뉴 2", kcal: 840, protein: 83, sugar: 32, sodium: 1200, grade: "C" },
    { id: 103, name: "대표 메뉴 3", kcal: 320, protein: 30, sugar: 32, sodium: 350, grade: "A" },
  ],
  2: [
    { id: 201, name: "시그니처 버거", kcal: 520, protein: 26, sugar: 10, sodium: 980, grade: "B" },
    { id: 202, name: "샐러드 볼", kcal: 290, protein: 18, sugar: 7, sodium: 420, grade: "A" },
  ],
  3: [
    { id: 301, name: "매운 볶음", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 302, name: "순한 볶음", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  4: [
    { id: 301, name: "매운 볶음", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 302, name: "순한 볶음", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  5: [
    { id: 301, name: "매운 볶음", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 302, name: "순한 볶음", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
};

// ----------------------
// 2) 정적 파일 제공 (public 폴더)
// ----------------------
//app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));
// ----------------------
// 3) API
// ----------------------

// (1) 음식점 목록
/*app.get("/api/stores", (req, res) => {
  res.json({ items: stores });
});*/

function loadStoresFromExcel() {
  // ✅ 파일명을 여기와 실제 파일명이 100% 같아야 함
  const filePath = path.join(__dirname, "data", "sejong_store.xlsx");

  console.log("[Excel] filePath:", filePath);
  console.log("[Excel] exists :", fs.existsSync(filePath));

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row, idx) => {
      const name = row["가맹점명"] || row["상호명"] || "";
      const addressRaw = row["사업장 상세주소"] || row["주소"] || "";
      const address = String(addressRaw).replace(/\[[^\]]*\]\s*/g, "").trim(); // [30098] 제거

      if (!name || !address) return null;

      return {
        id: idx + 1,
        name,
        address,
        tel: row["전화번호"] || row["연락처"] || "",
        tag: row["업종"] || row["업태"] || "일반음식점",
        rating: 4.3,
        reviews: Math.floor(Math.random() * 500) + 10,
        kcalAvg: Math.floor(Math.random() * 400) + 300,
      };
    })
    .filter(Boolean);
}

let storesCache = [];

app.get("/api/stores", (req, res) => {
  try {
    storesCache = loadStoresFromExcel();  // ✅ 캐시 갱신
    res.json({ items: storesCache });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "엑셀 로딩 실패" });
  }
});

// (2) 음식점 상세
/*app.get("/api/stores/:id", (req, res) => {
  const id = Number(req.params.id);
  const store = stores.find(s => s.id === id);
  if (!store) return res.status(404).json({ message: "store not found" });
  res.json(store);
});*/
app.get("/api/stores/:id", (req, res) => {
  const id = Number(req.params.id);

  // 캐시가 비어있으면 한 번 로딩
  if (!storesCache.length) {
    try {
      storesCache = loadStoresFromExcel();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "엑셀 로딩 실패" });
    }
  }

  const store = storesCache.find((s) => s.id === id);
  if (!store) return res.status(404).json({ message: "store not found" });
  res.json(store);
});
// (3) 음식점 메뉴 목록
app.get("/api/stores/:id/menus", (req, res) => {
  const id = Number(req.params.id);
  const menus = menusByStoreId[id];
  if (!menus) return res.json({ items: [] }); // 메뉴 없는 경우도 화면 안 깨지게
  res.json({ items: menus });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
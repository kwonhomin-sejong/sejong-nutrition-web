const express = require("express");
const path = require("path");

const app = express();
//const PORT = process.env.PORT || 3000;

// ----------------------
// 1) Mock Data (나중에 DB/외부API로 교체 가능)
// ----------------------
const stores = [
  { id: 1, name: "페리카나", tag: "이런건 가맹", rating: 4.5, reviews: 1200, kcalAvg: 588, address: "세종특별자치시 갈매로 479 상가동 페리카나", lat: 36.4801, lng: 127.2602  },
  { id: 2, name: "음식점 B", tag: "이런건 가맹", rating: 4.2, reviews: 310,  kcalAvg: 380, address: "세종시 OO로 XX길 12" , lat: 36.4822, lng: 127.2581 },
  { id: 3, name: "음식점 C", tag: "이런건 가맹", rating: 4.3, reviews: 76,   kcalAvg: 760, address: "세종시 AA로 BB길 3",  lat: 36.4788, lng: 127.2655 },
];

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
app.get("/api/stores", (req, res) => {
  res.json({ items: stores });
});

// (2) 음식점 상세
app.get("/api/stores/:id", (req, res) => {
  const id = Number(req.params.id);
  const store = stores.find(s => s.id === id);
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
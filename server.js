const express = require("express");
const path = require("path");
const app = express();

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

const stores = [
  {
    id: 1,
    name: "(주)국사랑세종",
    tag: "음식점",
    rating: 4.3,
    reviews: 120,
    kcalAvg: 520,
    address: "세종특별자치시 보듬4로 9 카림에비뉴상가 41호",
    phone: "044-863-9455",
  },
  {
    id: 2,
    name: "(주)그로서리스터프",
    tag: "음식점",
    rating: 4.1,
    reviews: 95,
    kcalAvg: 480,
    address: "세종특별자치시 새롬중앙로 63 1층 110호",
    phone: "044-862-2118",
  },
  {
    id: 3,
    name: "(주)더팬테스틱 브래드카페 좋은아침페스츄리 세종보람점",
    tag: "음식점",
    rating: 4.4,
    reviews: 210,
    kcalAvg: 560,
    address: "세종특별자치시 시청대로 205 1층 좋은아침페스츄리",
    phone: "044-862-4091",
  },
  {
    id: 4,
    name: "(주)디엠 카페브릿지(기독교서점봄)",
    tag: "음식점",
    rating: 4.2,
    reviews: 80,
    kcalAvg: 430,
    address: "세종특별자치시 새롬중앙로 64 6층",
    phone: "044-715-7982",
  },
  {
    id: 5,
    name: "(주)만정에프엔비",
    tag: "음식점",
    rating: 4.0,
    reviews: 60,
    kcalAvg: 500,
    address: "세종특별자치시 국책연구원2로 18",
    phone: "",
  },
  {
    id: 6,
    name: "(주)메모리팩토리",
    tag: "일반음식점",
    rating: 4.3,
    reviews: 120,
    kcalAvg: 650,
    address: "세종특별자치시 바른7길 43 메모리팩토리",
    phone: "",
  },
  {
    id: 7,
    name: "(주)성웅",
    tag: "일반음식점",
    rating: 4.2,
    reviews: 95,
    kcalAvg: 620,
    address: "세종특별자치시 새롬중앙로 33 116호",
    phone: "",
  },
  {
    id: 8,
    name: "(주)신용-롯데리아 홈플러스조치원점",
    tag: "일반음식점",
    rating: 4.1,
    reviews: 310,
    kcalAvg: 780,
    address: "세종특별자치시 조치원읍 허만석로 60 1층 롯데리아",
    phone: "",
  },
  {
    id: 9,
    name: "(주)엠원업 8층 스낵",
    tag: "일반음식점",
    rating: 4.0,
    reviews: 48,
    kcalAvg: 550,
    address: "세종특별자치시 금남면 용포로 115 8층 일부호 (엠원업빌딩)",
    phone: "",
  },
  {
    id: 10,
    name: "(주)엠원업 카페테리아",
    tag: "일반음식점",
    rating: 4.4,
    reviews: 72,
    kcalAvg: 520,
    address: "세종특별자치시 금남면 용포로 115 9층 901호 (엠원업빌딩)",
    phone: "",
  },
  {
    id: 11,
    name: "(주)영평식품",
    tag: "일반음식점",
    rating: 4.3,
    reviews: 66,
    kcalAvg: 690,
    address: "세종특별자치시 장군면 영평사길 93",
    phone: "",
  },
  {
    id: 12,
    name: "(주)유오티",
    tag: "일반음식점",
    rating: 4.1,
    reviews: 34,
    kcalAvg: 610,
    address: "세종특별자치시 전의면 운주산로 1050 1",
    phone: "",
  },
  {
    id: 13,
    name: "(주)해밀리 장재리100번지",
    tag: "일반음식점",
    rating: 4.5,
    reviews: 180,
    kcalAvg: 820,
    address: "세종특별자치시 금남면 금남구즉로 356 갈비집",
    phone: "",
  },
  {
    id: 14,
    name: "(주)해피엠",
    tag: "일반음식점",
    rating: 4.2,
    reviews: 59,
    kcalAvg: 640,
    address: "세종특별자치시 장군면 월현윗길 38-9 봉안리 216-5",
    phone: "",
  },
  {
    id: 15,
    name: "121번가",
    tag: "일반음식점",
    rating: 4.3,
    reviews: 88,
    kcalAvg: 700,
    address: "세종특별자치시 절재로 194 202호",
    phone: "",
  },
  {
    id: 16,
    name: "15000족발 세종나성점",
    tag: "일반음식점",
    rating: 4.4,
    reviews: 260,
    kcalAvg: 890,
    address: "세종특별자치시 한누리대로 237 103호",
    phone: "",
  },
  {
    id: 17,
    name: "15000족발 조치원점",
    tag: "일반음식점",
    rating: 4.3,
    reviews: 210,
    kcalAvg: 870,
    address: "세종특별자치시 조치원읍 충현로 69 3로",
    phone: "",
  },
  {
    id: 18,
    name: "153 바지락 칼국수",
    tag: "일반음식점",
    rating: 4.5,
    reviews: 145,
    kcalAvg: 560,
    address: "세종특별자치시 달빛로 80 후문상가 2동 210호",
    phone: "",
  },
  {
    id: 19,
    name: "1972송은정보리밥본점",
    tag: "일반음식점",
    rating: 4.6,
    reviews: 390,
    kcalAvg: 680,
    address: "세종특별자치시 조치원읍 세종로 2427 송은정보리밥본점",
    phone: "",
  },
];

const menusByStoreId = {
  1: [
    { id: 101, name: "대표 메뉴 1", kcal: 500, protein: 50, sugar: 20, sodium: 800, grade: "B" },
    { id: 102, name: "대표 메뉴 2", kcal: 840, protein: 83, sugar: 32, sodium: 1200, grade: "C" },
    { id: 103, name: "대표 메뉴 3", kcal: 320, protein: 30, sugar: 32, sodium: 350, grade: "A" },
  ],
  2: [
    { id: 201, name: "대표 메뉴 1", kcal: 520, protein: 26, sugar: 10, sodium: 980, grade: "B" },
    { id: 202, name: "대표 메뉴 2", kcal: 290, protein: 18, sugar: 7, sodium: 420, grade: "A" },
  ],
  3: [
    { id: 301, name: "대표 메뉴 1", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 302, name: "대표 메뉴 2", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  4: [
    { id: 401, name: "대표 메뉴 1", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 402, name: "대표 메뉴 2", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  5: [
    { id: 501, name: "대표 메뉴 1", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 502, name: "대표 메뉴 2", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  6: [
    { id: 601, name: "대표 메뉴 1", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 602, name: "대표 메뉴 2", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  7: [
    { id: 701, name: "대표 메뉴 1", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 701, name: "대표 메뉴 2", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 701, name: "대표 메뉴 3", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 702, name: "대표 메뉴 4", kcal: 780, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  8: [
    { id: 801, name: "대표 메뉴 1", kcal: 910, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 802, name: "대표 메뉴 2", kcal: 400, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  9: [
    { id: 901, name: "대표 메뉴 1", kcal: 300, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 902, name: "대표 메뉴 2", kcal: 620, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
  ],
  10: [
    { id: 1001, name: "대표 메뉴 1", kcal: 360, protein: 33, sugar: 14, sodium: 1600, grade: "D" },
    { id: 1002, name: "대표 메뉴 2", kcal: 470, protein: 28, sugar: 9, sodium: 1200, grade: "C" },
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
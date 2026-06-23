const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const scoresPath = path.join(__dirname, "../data/scores.json");

// 確保 scores.json 存在，避免伺服器因找不到檔案而崩潰
let raw = [];
if (fs.existsSync(scoresPath)) {
  raw = JSON.parse(fs.readFileSync(scoresPath, "utf-8"));
} else {
  console.warn("⚠️ 警告：目前尚未生成 scores.json。請先執行 npm run import 或是 node scripts/import.js 進行轉換！");
}

/* ==========================================
   📊 GET /scores
   - 獲取所有歷年分數資料
   ========================================== */
router.get("/", (req, res) => {
  res.json(raw);
});

/* ==========================================
   🏫 GET /scores/school/:school
   - 獲取特定學校的所有科系分數與名額資料
   ========================================== */
router.get("/school/:school", (req, res) => {
  const schoolName = req.params.school;
  res.json(
    raw.filter(d => d.school === schoolName)
  );
});

/* ==========================================
   🔍 GET /scores/department
   - 精確查詢某校某科系的分數（支援 Query Params）
   - 範例：/scores/department?school=國立臺灣師範大學&department=教育學系
   ========================================== */
router.get("/department", (req, res) => {
  const { school, department } = req.query;

  const result = raw.find(
    d => d.school === school && d.department === department
  );

  res.json(result || null);
});

/* ==========================================
   📈 GET /scores/trend
   - 查詢某校某科系歷年（111-115）的篩選分數與招生名額趨勢
   - 範例：/scores/trend?school=國立臺灣師範大學&department=教育學系
   ========================================== */
router.get("/trend", (req, res) => {
  const { school, department } = req.query;

  const result = raw
    .filter(d => d.school === school && d.department === department)
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      year: d.year,
      cutoff: d.cutoff,
      admission_quota: d.admission_quota // 🚀 額外回傳招生名額，讓前端可以同步繪製名額變化折線圖！
    }));

  res.json(result);
});

module.exports = router;
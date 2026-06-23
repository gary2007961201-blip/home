const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   📚 檔案路徑設定
========================= */
const aiScoresPath = path.join(__dirname, "data", "ai_scores.json");

// 輔助函式：安全讀取 AI 辨識的分數檔案
function getAiScoresData() {
  try {
    if (fs.existsSync(aiScoresPath)) {
      return JSON.parse(fs.readFileSync(aiScoresPath, "utf8"));
    }
  } catch (err) {
    console.error("⚠️ 讀取 data/ai_scores.json 失敗或格式損毀：", err.message);
  }
  return []; // 若檔案不存在或出錯，回傳空陣列防當機
}

/* ==========================================
   📈 GET /scores/trend (✨ 新增核心修正路由)
   - 根據 3 位數學校代碼 (school_code) 與科系名稱查詢歷年分數
   ========================================== */
app.get("/scores/trend", (req, res) => {
  try {
    const { school_code, department } = req.query;

    if (!school_code || !department) {
      return res.status(400).json({ error: "缺少 school_code 或 department 參數" });
    }

    const aiScoresData = getAiScoresData();

    // 標準化學校代碼（防呆補零）
    const targetCode = String(school_code).padStart(3, "0");

    console.log(`🔍 正在查詢歷年趨勢 - 學校代碼: ${targetCode}, 科系: ${department}`);

    // 精準過濾出符合該校代碼與科系名稱的所有年份資料
    const trends = aiScoresData.filter((item) => {
      const itemCode = String(item.school_code || item.schoolCode || "").padStart(3, "0");
      const itemName = item.department_name || item.department;

      return itemCode === targetCode && itemName === department;
    });

    console.log(`✨ 查詢成功，共找到 ${trends.length} 筆歷史年份紀錄。`);
    res.json(trends);

  } catch (error) {
    console.error("❌ 查詢歷年趨勢失敗:", error.message);
    res.status(500).json({ error: "伺服器內部錯誤" });
  }
});

/* =========================
   📦 其他路由模組
========================= */
const scoresRouter = require("./routes/scores");
app.use("/scores", scoresRouter);

/* =========================
   🏫 GET /schools
   - 學校清單（完全從 ai_scores 動態計算，並排除重複）
========================= */
app.get("/schools", (req, res) => {
  const aiScoresData = getAiScoresData();
  const schoolMap = new Map();

  aiScoresData.forEach((item) => {
    const code = String(item.school_code || item.schoolCode || "").padStart(3, "0");
    const name = item.school_name || item.schoolName;

    if (!code || !name || code === "000" || name === "未知學校") return;

    // 若有多個年度名稱不同，以最新（或較長）的名稱為主
    if (!schoolMap.has(code)) {
      schoolMap.set(code, { id: code, school: name });
    }
  });

  const schoolList = Array.from(schoolMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  res.json(schoolList);
});

/* =========================
   🏫 GET /school/:id
   - 單一學校詳細頁面
========================= */
app.get("/school/:id", (req, res) => {
  const schoolCode = String(req.params.id).padStart(3, "0");
  const aiScoresData = getAiScoresData();

  const matchedRecords = aiScoresData.filter((item) => String(item.school_code || item.schoolCode || "").padStart(3, "0") === schoolCode);

  if (matchedRecords.length === 0) {
    return res.status(404).json({ message: `找不到代碼為 ${schoolCode} 的學校資料` });
  }

  const latestRecord = matchedRecords.reduce((latest, current) => {
    return (Number(current.year) > Number(latest.year)) ? current : latest;
  }, matchedRecords[0]);
  
  const schoolName = latestRecord.school_name || latestRecord.schoolName || "未知學校";

  const deptMap = new Map();
  matchedRecords.forEach((item) => {
    const name = item.department_name || item.department; 
    const code = item.department_code || item.departmentCode;
    const year = Number(item.year || 0);

    if (!name) return;

    if (!deptMap.has(name)) {
      deptMap.set(name, { name, code: String(code), year });
    } else {
      const existing = deptMap.get(name);
      if (year > existing.year || (year === existing.year && String(code) < existing.code)) {
        deptMap.set(name, { name, code: String(code), year });
      }
    }
  });

  const sortedDeptObjects = Array.from(deptMap.values());
  sortedDeptObjects.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.code.localeCompare(b.code);
  });

  const departments = sortedDeptObjects.map((d) => d.name);

  matchedRecords.sort((a, b) => {
    const yearA = Number(a.year || 0);
    const yearB = Number(b.year || 0);
    if (yearB !== yearA) return yearB - yearA;

    const codeA = String(a.department_code || a.departmentCode || "");
    const codeB = String(b.department_code || b.departmentCode || "");
    return codeA.localeCompare(codeB);
  });

  res.json({
    id: schoolCode,               
    school: schoolName,           
    departments: departments,     
    records: matchedRecords        
  });
});

/* =========================
   🔍 GET /search
   - 智慧搜尋：完全重構為從 ai_scores 提取基礎學校與科系資訊
========================= */
app.get("/search", (req, res) => {
  // 1. 取得搜尋關鍵字，轉小寫，並將所有的「台」都標準化替換為「臺」
  const rawQ = (req.query.q || "").trim().toLowerCase();
  const q = rawQ.replace(/台/g, "臺"); 
  
  if (!q) return res.json([]);

  const aiScoresData = getAiScoresData();

  // 2. 先用 Map 整理出所有不重複的「學校與其底下所有不重複科系」
  const schoolDeptMap = new Map();

  aiScoresData.forEach((item) => {
    const code = String(item.school_code || item.schoolCode || "").padStart(3, "0");
    const schoolName = item.school_name || item.schoolName || "";
    const deptName = item.department_name || item.department || "";

    if (!code || !schoolName || code === "000") return;

    if (!schoolDeptMap.has(code)) {
      schoolDeptMap.set(code, {
        id: code,
        school: schoolName,
        deptsSet: new Set()
      });
    }
    if (deptName) {
      schoolDeptMap.get(code).deptsSet.add(deptName);
    }
  });

  // 3. 根據搜尋關鍵字進行智慧過濾（比對時，學校與科系名也同步將「台」轉成「臺」）
  const result = [];
  schoolDeptMap.forEach((data, code) => {
    // 將資料庫裡的學校名稱，轉小寫並把「台」代換成「臺」來做背後比對
    const schoolNameNormalized = data.school.toLowerCase().replace(/台/g, "臺");
    const matchSchool = schoolNameNormalized.includes(q);

    const allDepts = Array.from(data.deptsSet);
    
    // 科系名稱比對時，也同步將「台」代換成「臺」
    const matchedDepartments = allDepts.filter((dept) => {
      const deptNormalized = dept.toLowerCase().replace(/台/g, "臺");
      return deptNormalized.includes(q);
    });

  // 如果標準化後的學校名字吻合，或是底下有科系名字吻合，才放入結果
    if (matchSchool || matchedDepartments.length > 0) {
      result.push({
        id: data.id,
        school: data.school, // 👈 這裡依然回傳原本正確的名稱（例如：國立臺灣大學），維持畫面美觀
        // 如果是學校名稱中，就秀出全部科系；如果是科系中，就只秀出符合的科系
        departments: matchSchool ? allDepts : matchedDepartments
      });
    }
  });

  res.json(result);
});
/* =========================
   📊 GET /stats (✨ 核心修正路由)
   - 儀表板統計資料：完全從 ai_scores 計算，且排除跨年度的重複科系
========================= */
app.get("/stats", (req, res) => {
  const aiScoresData = getAiScoresData();

  const schoolSet = new Set();
  const deptSet = new Set();

  aiScoresData.forEach((item) => {
    const schoolCode = String(item.school_code || item.schoolCode || "").padStart(3, "0");
    const schoolName = item.school_name || item.schoolName;
    const deptName = item.department_name || item.department;

    if (!schoolCode || !schoolName || schoolCode === "000") return;

    // 1. 收集不重複的學校代碼
    schoolSet.add(schoolCode);

    // 2. 收集不重複的科系（不重複計算不同年度的同一科系）
    // 使用「學校代碼 + 科系名稱」作為唯一組合 Key，確保不同學校但同名的科系可以被分開算，而同校同科系不同年份只算一次
    if (deptName) {
      deptSet.add(`${schoolCode}-${deptName}`);
    }
  });

  res.json({
    schools: schoolSet.size,       // 完全對齊 ai_scores 的學校數量
    departments: deptSet.size      // 不重複計算不同年度的同一科系數量
  });
});

/* =========================
   🚀 啟動伺服器
========================= */
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 數據中心後端伺服器已成功啟動！`);
  console.log(`📡 運行網址：http://localhost:${PORT}`);
  console.log(`🤖 AI 分數檔案：${aiScoresPath} (完全動態統計與多順序篩選)`);
  console.log(`=========================================`);
});
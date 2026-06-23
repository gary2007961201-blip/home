const fs = require("fs");
const path = require("path");

const aiScoresPath = path.join(__dirname, "../data/ai_scores.json");
const schoolsOutputPath = path.join(__dirname, "../data/schools.json");
const scoresOutputPath = path.join(__dirname, "../data/scores.json");

function run() {
  if (!fs.existsSync(aiScoresPath)) {
    console.error("❌ 錯誤：找不到 data/ai_scores.json，請確認爬蟲已經成功運行並儲存資料！");
    return;
  }

  console.log("🔄 開始讀取並解析最新的 ai_scores.json...");
  const aiScores = JSON.parse(fs.readFileSync(aiScoresPath, "utf-8"));

  if (aiScores.length === 0) {
    console.warn("⚠️ 警告：ai_scores.json 內沒有任何資料！");
    return;
  }

  // ==========================================
  // 1. 產生 schools.json (相容原 server.js 的搜尋與列表邏輯)
  // 結構：[{ id: 1, school: "學校名稱", departments: ["科系A", "科系B"] }]
  // ==========================================
  console.log("🏫 正在分析學校與科系關聯...");
  const schoolMap = new Map();

  aiScores.forEach(item => {
    const schoolName = item.school_name;
    const deptName = item.department_name;

    if (!schoolMap.has(schoolName)) {
      schoolMap.set(schoolName, new Set());
    }
    schoolMap.get(schoolName).add(deptName);
  });

  let schoolId = 1;
  const schoolsData = [];

  schoolMap.forEach((deptsSet, schoolName) => {
    schoolsData.push({
      id: schoolId++,
      school: schoolName,
      // 排序科系名稱，看起來更整齊
      departments: Array.from(deptsSet).sort()
    });
  });

  fs.writeFileSync(schoolsOutputPath, JSON.stringify(schoolsData, null, 2), "utf-8");
  console.log(`✅ 成功產出學校主檔：schools.json 共包含 ${schoolsData.length} 間學校。`);

  // ==========================================
  // 2. 產生 scores.json (保留豐富的新欄位，同時相容舊版分數 API)
  // 結構：[{ year, school_code, school, department_code, department, admission_quota, cutoff }]
  // ==========================================
  console.log("📊 正在轉換並生成歷年分數主檔...");
  
  const scoresData = aiScores.map(item => ({
    year: Number(item.year),
    school_code: item.school_code,
    school: item.school_name,
    department_code: item.department_code,
    department: item.department_name,
    admission_quota: item.admission_quota || "N/A", // 保留我們剛才新增的招生名額
    cutoff: item.cutoff_standard                  // 將 cutoff_standard 對接為原有的 cutoff 欄位
  }));

  fs.writeFileSync(scoresOutputPath, JSON.stringify(scoresData, null, 2), "utf-8");
  console.log(`✅ 成功產出分數主檔：scores.json 共包含 ${scoresData.length} 筆歷年數據。`);
  console.log("\n🎉 數據導入轉換完成！現在你可以重啟 Express 伺服器了。");
}

run();
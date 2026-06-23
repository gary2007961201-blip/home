import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

export default function School() {
  const { id } = useParams(); // 從 React Router 網址中解析出學校 ID (例如: /school/153)
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const highlightDept = searchParams.get("dept"); // 從網址 query string 讀取科系 (例如: ?dept=土木與工程管理學系)

  const [schoolData, setSchoolData] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const deptElementsRef = useRef({});

  // ==========================================
  // 🏛️ 1. 載入學校基本資料與所有「不重複」科系
  // ==========================================
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 自動將 ID 格式化為 3 位數（例如 153 保持 153，2 變成 002）
    const formattedId = String(id).padStart(3, "0");

    fetch(`http://localhost:3000/school/${formattedId}`)
      .then((res) => {
        if (!res.ok) throw new Error("學校不存在");
        return res.json();
      })
      .then((data) => {
        // 後端回傳格式：{ id: "153", school: "國立金門大學", departments: [...不重複科系], records: [...] }
        setSchoolData(data);
        setIsLoading(false);

        // 如果首頁有點擊特定的科系，進入後直接設為選取狀態
        if (highlightDept && data.departments && data.departments.includes(highlightDept)) {
          setSelectedDept(highlightDept);
        }
      })
      .catch((err) => {
        console.error("無法載入學校詳情:", err);
        setIsLoading(false);
      });
  }, [id, highlightDept]);

  // ==========================================
  // 📈 2. 當使用者選取特定科系時，抓取歷年篩選分數趨勢
  // ==========================================
  useEffect(() => {
    if (!schoolData || !selectedDept) {
      setTrendData([]);
      return;
    }

    setIsTrendLoading(true);

    // 精準使用 3 位數 school_code 查詢歷年趨勢
    fetch(
      `http://localhost:3000/scores/trend?school_code=${schoolData.id}&department=${encodeURIComponent(selectedDept)}`
    )
      .then((res) => res.json())
      .then((data) => {
        setTrendData(data || []);
        setIsTrendLoading(false);

        // 3. 畫面自動平滑滾動並聚焦到該選取的科系卡片
        setTimeout(() => {
          if (deptElementsRef.current[selectedDept]) {
            deptElementsRef.current[selectedDept].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 150);
      })
      .catch((err) => {
        console.error("無法載入科系趨勢資料:", err);
        setIsTrendLoading(false);
      });
  }, [selectedDept, schoolData]);

  // 🚨 安全檢查：路由參數遺失
  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">路由參數遺失</h2>
          <p className="text-slate-500 mb-6">系統無法偵測到要載入的學校代碼，請嘗試重新搜尋。</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
          >
            返回搜尋首頁
          </button>
        </div>
      </div>
    );
  }

  // ⏳ 讀取狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 font-semibold">正在動態調閱校系分數...</p>
        </div>
      </div>
    );
  }

  // 🫙 找不到學校
  if (!schoolData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200">
          <div className="text-slate-400 text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">找不到該學校資訊</h2>
          <p className="text-slate-500 mb-6">您所查詢的學校目前尚未匯入任何篩選級分資料。</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
          >
            回首頁
          </button>
        </div>
      </div>
    );
  }

  // 💡 預先找出趨勢資料中的最新年份（用於畫面上高亮顯示「最新」標籤）
  const maxYear = trendData.length > 0 ? Math.max(...trendData.map((d) => Number(d.year || 0))) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* 頂部學校橫幅 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 text-white py-12 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white text-sm font-semibold mb-2 flex items-center gap-1 transition-colors"
            >
              ← 返回搜尋首頁
            </button>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                代碼 {String(schoolData.id).padStart(3, "0")}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {schoolData.school}
              </h1>
            </div>
          </div>
          <div className="text-slate-400 text-sm md:text-right">
            <div>共開設 <span className="text-white font-bold">{schoolData.departments ? schoolData.departments.length : 0}</span> 個學術科系</div>
          </div>
        </div>
      </div>

      {/* 科系列表區 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-slate-500 mb-4 uppercase tracking-wider">學系一覽</h2>
        
        <div className="space-y-4">
          {/* 💡 後端已將 departments 做過不重複處理與優化排序，直接安心 map */}
          {(schoolData.departments || []).map((dept) => {
            const isExpanded = selectedDept === dept;

            return (
              <div
                key={dept}
                ref={(el) => (deptElementsRef.current[dept] = el)}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? "border-indigo-500 shadow-md ring-1 ring-indigo-500/10"
                    : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* 點擊展開的學系頭部 */}
                <div
                  onClick={() => setSelectedDept(isExpanded ? null : dept)}
                  className="p-5 flex justify-between items-center cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{dept}</span>
                  </div>
                  
                  {/* 右側箭頭圖示 */}
                  <div className="text-slate-400">
                    {isExpanded ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 展開後的歷史數據看板 */}
                {isExpanded && (
                  <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-6">
                    {isTrendLoading ? (
                      <div className="py-8 text-center text-slate-500 text-sm font-medium">
                        正在調閱 AI 歷年數據庫...
                      </div>
                    ) : trendData.length > 0 ? (
                      <div className="max-w-3xl mx-auto space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                          歷年篩選級分與門檻變動
                        </h3>
                        
                        <div className="space-y-4">
                          {[...trendData]
                            .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
                            .map((t) => {
                              const currentYear = Number(t.year || 0);
                              const isLatestYear = currentYear === maxYear && maxYear > 0;

                              return (
                                <div 
                                  key={t.year} 
                                  className={`bg-white p-5 rounded-xl border transition-all ${
                                    isLatestYear 
                                      ? "border-indigo-200 shadow-sm ring-4 ring-indigo-500/5" 
                                      : "border-slate-200/70"
                                  }`}
                                >
                                  {/* 上半部：年份與當年度名額 */}
                                  <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-800 text-lg">
                                        {t.year} 學年度
                                      </span>
                                      {isLatestYear && (
                                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                                          最新
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">
                                      招生名額：
                                      <span className={`font-bold text-sm ${isLatestYear ? "text-indigo-600" : "text-slate-700"}`}>
                                        {t.admission_quota || "—"}
                                      </span> 人
                                    </div>
                                  </div>

                                  {/* 下半部：多級篩選順序 */}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {t.cutoff_filters && t.cutoff_filters.length > 0 ? (
                                      t.cutoff_filters.map((filter, idx) => (
                                        <React.Fragment key={idx}>
                                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs shadow-sm">
                                            <span className={`px-2 py-1 font-bold text-white ${
                                              isLatestYear ? "bg-indigo-600" : "bg-slate-500"
                                            }`}>
                                              {filter.order ? `順序 ${filter.order}` : `參酌`}
                                            </span>
                                            <span className="px-2.5 py-1 text-slate-800 font-bold bg-white flex items-center gap-1">
                                              {filter.subject} 
                                              <span className="text-indigo-600 font-extrabold text-sm">{filter.score}</span> 
                                              <span className="text-slate-400 font-normal text-[10px]">{filter.type || "級分"}</span>
                                            </span>
                                          </div>
                                          
                                          {idx < t.cutoff_filters.length - 1 && (
                                            <span className="text-slate-300 font-bold text-sm mx-0.5">➔</span>
                                          )}
                                        </React.Fragment>
                                      ))
                                    ) : (
                                      <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 w-full">
                                        <span className="text-xs font-bold text-slate-400 block mb-0.5">篩選標準說明</span>
                                        <span className="font-semibold text-slate-700">
                                          {t.raw_cutoff_text || t.cutoff || "未提供詳細門檻說明"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        此系組暫無歷史一階篩選資料。
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
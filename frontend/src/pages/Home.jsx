import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ schools: 0, departments: 0 });
  const navigate = useNavigate();

  const [schoolList, setSchoolList] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);

  // 智慧展開功能狀態
  const [searchTrendData, setSearchTrendData] = useState({});
  const [expandedDepts, setExpandedDepts] = useState([]);
  const [deptLoadingStates, setDeptLoadingStates] = useState({});

  // 💡 新增：待篩選校系清單（初始化自 localStorage）
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("selected_departments");
    return saved ? JSON.parse(saved) : [];
  });

  // 同步暫存清單至 localStorage
  useEffect(() => {
    localStorage.setItem("selected_departments", JSON.stringify(cartItems));
  }, [cartItems]);

  // 📊 載入統計數據與學校列表
  useEffect(() => {
    fetch("http://localhost:3000/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats({ schools: data.schools || 0, departments: data.departments || 0 });
      })
      .catch((err) => console.error("❌ 無法獲取統計資料:", err));

    setIsListLoading(true);
    fetch("http://localhost:3000/schools") 
      .then((res) => res.json())
      .then((data) => {
        setSchoolList(data || []);
        setIsListLoading(false);
      })
      .catch((err) => {
        console.error("❌ 無法獲取學校清單:", err);
        setIsListLoading(false);
      });
  }, []);

  // 🔍 搜尋防抖機制
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    let isActive = true;

    const delayDebounceFn = setTimeout(() => {
      fetch(`http://localhost:3000/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (isActive) {
            setSearchResults(data || []);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error("❌ 搜尋失敗:", err);
          if (isActive) setIsLoading(false);
        });
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery]);

  // ⚡ 動態展開分數
  const toggleSearchDeptExpand = async (schoolId, deptName) => {
    const formattedId = String(schoolId).padStart(3, "0");
    const uniqueKey = `${formattedId}-${deptName}`;
    const isCurrentlyExpanded = expandedDepts.includes(uniqueKey);

    if (isCurrentlyExpanded) {
      setExpandedDepts(expandedDepts.filter(key => key !== uniqueKey));
    } else {
      setExpandedDepts([...expandedDepts, uniqueKey]);

      if (!searchTrendData[uniqueKey]) {
        setDeptLoadingStates(prev => ({ ...prev, [uniqueKey]: true }));
        try {
          const res = await fetch(`http://localhost:3000/scores/trend?school_code=${formattedId}&department=${encodeURIComponent(deptName)}`);
          const data = await res.json();
          setSearchTrendData(prev => ({ ...prev, [uniqueKey]: data || [] }));
        } catch (err) {
          console.error(`❌ 無法獲取歷年分數:`, err);
        } finally {
          setDeptLoadingStates(prev => ({ ...prev, [uniqueKey]: false }));
        }
      }
    }
  };

  // 💡 新增：切換加入/移除待篩選校系
  const toggleCartItem = (e, schoolId, schoolName, deptName) => {
    e.stopPropagation(); // 防止觸發展開面板
    const formattedId = String(schoolId).padStart(3, "0");
    
    const exists = cartItems.some(
      (item) => item.schoolId === formattedId && item.deptName === deptName
    );

    if (exists) {
      setCartItems(cartItems.filter((item) => !(item.schoolId === formattedId && item.deptName === deptName)));
    } else {
      setCartItems([...cartItems, { schoolId: formattedId, schoolName, deptName }]);
    }
  };

  const handleSchoolClick = (schoolId) => {
    if (!schoolId) return;
    navigate(`/school/${schoolId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative pb-20">
      
      {/* 💡 右下角/右上角 待篩選清單懸浮按鈕 */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all font-bold group scale-100 hover:scale-105"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          待篩選校系
          <span className="bg-white text-emerald-700 rounded-full px-2 py-0.5 text-xs font-black min-w-[20px] text-center">
            {cartItems.length}
          </span>
        </button>
      </div>

      {/* 🚀 頂部橫幅 */}
      <header className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-blue-900 text-white py-16 px-4 text-center shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-white">
            大學申請入學一階落點分析系統
          </h1>
          <p className="text-indigo-200 text-base md:text-lg mb-8 max-w-2xl mx-auto font-medium">
            智慧辨識最新歷年分數標準，助你精準填寫志願
          </p>

          <div className="flex flex-wrap justify-center items-center gap-6 max-w-lg mx-auto">
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 min-w-[130px] shadow-sm">
              <span className="text-2xl md:text-3xl font-black text-white">{stats.schools}</span>
              <span className="text-xs text-indigo-200 font-bold mt-1">已收錄學校</span>
            </div>
            <div className="hidden md:block w-px h-10 bg-white/20"></div>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 min-w-[130px] shadow-sm">
              <span className="text-2xl md:text-3xl font-black text-white">{stats.departments}</span>
              <span className="text-xs text-indigo-200 font-bold mt-1">已解析科系組</span>
            </div>
          </div>
        </div>
      </header>

      {/* 🔍 搜尋與列表主區塊 */}
      <main className="max-w-4xl w-full mx-auto px-4 py-12 flex-1">
        <div className="relative mb-12 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all text-base md:text-lg font-medium"
            placeholder="輸入學校或科系名稱（例如：台灣大學、電機...）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {/* 📋 內容顯示區 */}
        <div className="max-w-3xl mx-auto">
          {!searchQuery.trim() && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <h2 className="text-xl font-bold text-slate-800 m-0">目前收錄學校一覽</h2>
              </div>
              
              {isListLoading ? (
                <div className="text-center py-12 text-slate-500 text-sm font-medium">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
                  <p>正在動態彙整最新分數資料庫...</p>
                </div>
              ) : schoolList.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
                  <p className="text-slate-500 font-medium">目前資料庫中尚未有任何 AI 分數數據。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {schoolList.map((item) => {
                    const schoolId = item.id;
                    const schoolName = item.school;

                    return (
                      <div
                        key={schoolId}
                        onClick={() => handleSchoolClick(schoolId)}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 hover:scale-[1.02] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                              代碼 {String(schoolId).padStart(3, "0")}
                            </span>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              大學
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors my-2 text-left line-clamp-1">
                            {schoolName}
                          </h3>
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between items-center text-xs text-slate-400">
                          <span className="text-slate-400 font-medium">包含歷史錄取標準</span>
                          <span className="text-indigo-600 font-bold group-hover:text-indigo-700 flex items-center gap-0.5 transition-colors">
                            查看科系 
                            <svg className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isLoading && (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
              <span className="text-4xl mb-3 block">🫙</span>
              <h3 className="text-base font-bold text-slate-700">找不到符合「{searchQuery}」的學校或科系</h3>
              <p className="text-sm text-slate-400 mt-1">請換個關鍵字試試看！</p>
            </div>
          )}

          {/* 💡 狀況 C：顯示搜尋結果 */}
          {searchQuery && searchResults.map((item) => {
            const schoolId = item.id;
            const schoolName = item.school;
            const displayCode = String(schoolId).padStart(3, "0");

            return (
              <div
                key={schoolId}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6 text-left"
              >
                <div 
                  onClick={() => handleSchoolClick(schoolId)}
                  className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                      代碼 {displayCode}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {schoolName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-0.5 transition-colors">
                    進入學校詳細頁面 ➔
                  </span>
                </div>
                
                <div>
                  <div className="space-y-3">
                    {item.departments && item.departments.map((dept, index) => {
                      const uniqueKey = `${displayCode}-${dept}`;
                      const isExpanded = expandedDepts.includes(uniqueKey);
                      const isTrendLoading = deptLoadingStates[uniqueKey];
                      const trendData = searchTrendData[uniqueKey] || [];
                      const maxYear = trendData.length > 0 ? Math.max(...trendData.map((d) => Number(d.year || 0))) : 0;

                      // 💡 檢查是否已被加入暫存清單
                      const isInCart = cartItems.some(c => c.schoolId === displayCode && c.deptName === dept);

                      return (
                        <div 
                          key={index}
                          className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                            isExpanded ? "border-indigo-500 ring-1 ring-indigo-500/10 shadow-sm" : "border-slate-200/60"
                          }`}
                        >
                          <div
                            onClick={() => toggleSearchDeptExpand(schoolId, dept)}
                            className="w-full bg-slate-50 hover:bg-indigo-50/40 p-4 flex justify-between items-center cursor-pointer transition-colors group/item"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-1.5 rounded-lg border transition-colors ${
                                isExpanded ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-slate-400"
                              }`}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                              </div>
                              <span className="text-base font-bold text-slate-700 truncate">
                                {dept}
                              </span>
                            </div>
                            
                            {/* 右側按鈕群群（包含暫存書籤 ＆ 展開箭頭） */}
                            <div className="flex items-center gap-3 ml-2">
                              {/* 💡 暫存清單按鈕 */}
                              <button
                                onClick={(e) => toggleCartItem(e, schoolId, schoolName, dept)}
                                className={`p-2 rounded-xl border transition-all ${
                                  isInCart 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs" 
                                    : "bg-white text-slate-300 hover:text-emerald-600 hover:border-emerald-200 border-slate-200"
                                }`}
                                title={isInCart ? "從待篩選移除" : "加入待篩選校系"}
                              >
                                <svg className="h-4 w-4" fill={isInCart ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </button>

                              <div className="text-slate-400">
                                {isExpanded ? (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 分數數據面板 */}
                          {isExpanded && (
                            <div className="bg-white border-t border-slate-100 p-4 space-y-4">
                              {isTrendLoading ? (
                                <div className="py-4 text-center text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                                  正在調閱歷年數據...
                                </div>
                              ) : trendData.length > 0 ? (
                                <div className="space-y-3">
                                  {[...trendData]
                                    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
                                    .map((t) => {
                                      const isLatestYear = Number(t.year || 0) === maxYear && maxYear > 0;
                                      return (
                                        <div key={t.year} className={`p-4 rounded-xl border ${isLatestYear ? "border-indigo-200 bg-indigo-50/10" : "border-slate-100 bg-slate-50/30"}`}>
                                          <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-slate-700 text-sm">{t.year} 學年度</span>
                                              {isLatestYear && <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">最新</span>}
                                            </div>
                                            <div className="text-xs text-slate-400">名額：<span className="font-bold text-slate-600">{t.admission_quota || "—"}</span> 人</div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            {t.cutoff_filters && t.cutoff_filters.length > 0 ? (
                                              t.cutoff_filters.map((filter, idx) => (
                                                <React.Fragment key={idx}>
                                                  <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden text-[11px]">
                                                    <span className={`px-1.5 py-0.5 font-bold text-white ${isLatestYear ? "bg-indigo-600" : "bg-slate-400"}`}>{filter.order ? `順序 ${filter.order}` : `參`}</span>
                                                    <span className="px-2 py-0.5 text-slate-700 font-bold flex items-center gap-1">{filter.subject} <span className="text-indigo-600 font-extrabold">{filter.score}</span></span>
                                                  </div>
                                                  {idx < t.cutoff_filters.length - 1 && <span className="text-slate-300 text-xs">➔</span>}
                                                </React.Fragment>
                                              ))
                                            ) : (
                                              <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 w-full">{t.raw_cutoff_text || t.cutoff || "未提供詳細門檻"}</div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-400 text-xs">此系組暫無歷史資料。</div>
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
          })}
        </div>
      </main>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const navigate = useNavigate();

  // 1. 從 localStorage 載入儲存的志願
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("selected_departments");
    return saved ? JSON.parse(saved) : [];
  });

  // 分數展開相關狀態
  const [cartTrendData, setCartTrendData] = useState({});
  const [expandedItems, setExpandedItems] = useState([]);
  const [itemLoadingStates, setItemLoadingStates] = useState({});

  // 同步刪除後的狀態回 localStorage
  useEffect(() => {
    localStorage.setItem("selected_departments", JSON.stringify(cartItems));
  }, [cartItems]);

  // 2. 切換展開並動態讀取歷史分數
  const toggleCartItemExpand = async (schoolId, deptName) => {
    const uniqueKey = `${schoolId}-${deptName}`;
    const isExpanded = expandedItems.includes(uniqueKey);

    if (isExpanded) {
      setExpandedItems(expandedItems.filter((key) => key !== uniqueKey));
    } else {
      setExpandedItems([...expandedItems, uniqueKey]);

      // 如果還沒抓過這個暫存系組的分數，動態調閱
      if (!cartTrendData[uniqueKey]) {
        setItemLoadingStates((prev) => ({ ...prev, [uniqueKey]: true }));
        try {
          const res = await fetch(
            `http://localhost:3000/scores/trend?school_code=${schoolId}&department=${encodeURIComponent(deptName)}`
          );
          const data = await res.json();
          setCartTrendData((prev) => ({ ...prev, [uniqueKey]: data || [] }));
        } catch (err) {
          console.error("❌ 無法獲取暫存系組分數:", err);
        } finally {
          setItemLoadingStates((prev) => ({ ...prev, [uniqueKey]: false }));
        }
      }
    }
  };

  // 3. 從清單中移除
  const removeCartItem = (schoolId, deptName) => {
    setCartItems(cartItems.filter((item) => !(item.schoolId === schoolId && item.deptName === deptName)));
    // 同步把展開狀態也關閉
    const uniqueKey = `${schoolId}-${deptName}`;
    setExpandedItems(expandedItems.filter((key) => key !== uniqueKey));
  };

  // 清空所有暫存
  const clearAllCart = () => {
    if (window.confirm("⚠️ 確定要清空所有考慮中的待篩選校系嗎？")) {
      setCartItems([]);
      setExpandedItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 text-white py-12 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white text-sm font-semibold mb-2 flex items-center gap-1 transition-colors"
            >
              ← 返回搜尋首頁
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-3">
              📋 待篩選校系比對清單
              <span className="bg-emerald-600 text-white text-sm font-black px-2.5 py-1 rounded-full">
                {cartItems.length} 個校系
              </span>
            </h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearAllCart}
              className="bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-center"
            >
              🗑️ 清空所有清單
            </button>
          )}
        </div>
      </div>

      {/* 暫存條狀清單列表 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto mt-8">
            <span className="text-5xl mb-4 block">🔖</span>
            <h3 className="text-lg font-bold text-slate-700">清單目前是空的</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6">
              在首頁搜尋科系時，點擊科系旁邊的書籤按鈕即可將考慮中的志願暫存至此。
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              前往搜尋科系
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, idx) => {
              const uniqueKey = `${item.schoolId}-${item.deptName}`;
              const isExpanded = expandedItems.includes(uniqueKey);
              const isTrendLoading = itemLoadingStates[uniqueKey];
              const trendData = cartTrendData[uniqueKey] || [];
              const maxYear = trendData.length > 0 ? Math.max(...trendData.map((d) => Number(d.year || 0))) : 0;

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/10" : "border-slate-200"
                  }`}
                >
                  {/* 清單卡片頭部 */}
                  <div
                    onClick={() => toggleCartItemExpand(item.schoolId, item.deptName)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`p-2 rounded-xl border shrink-0 transition-colors ${
                        isExpanded ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500"
                      }`}>
                        <span className="text-xs font-black tracking-wider">代碼 {item.schoolId}</span>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">{item.schoolName}</div>
                        <div className="text-lg font-extrabold text-slate-800 mt-0.5">{item.deptName}</div>
                      </div>
                    </div>

                    {/* 右側操作按鍵 */}
                    <div className="flex items-center justify-end gap-4 ml-auto sm:ml-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCartItem(item.schoolId, item.deptName);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="自清單中移除"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a3 3 0 003 3h10M4 7h16" />
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

                  {/* 展開的分數數據面板 */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-4">
                      {isTrendLoading ? (
                        <div className="py-6 text-center text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                          正在跨校調閱歷年數據庫...
                        </div>
                      ) : trendData.length > 0 ? (
                        <div className="space-y-3 max-w-3xl mx-auto">
                          {[...trendData]
                            .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
                            .map((t) => {
                              const isLatestYear = Number(t.year || 0) === maxYear && maxYear > 0;

                              return (
                                <div
                                  key={t.year}
                                  className={`bg-white p-4 rounded-xl border transition-all ${
                                    isLatestYear ? "border-emerald-200 shadow-xs ring-4 ring-emerald-500/5" : "border-slate-200/60"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-700 text-sm">{t.year} 學年度</span>
                                      {isLatestYear && (
                                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">最新</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                      招生名額：<span className="font-bold text-slate-700">{t.admission_quota || "—"}</span> 人
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {t.cutoff_filters && t.cutoff_filters.length > 0 ? (
                                      t.cutoff_filters.map((filter, idx) => (
                                        <React.Fragment key={idx}>
                                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md overflow-hidden text-[11px] shadow-2xs">
                                            <span className={`px-1.5 py-0.5 font-bold text-white ${isLatestYear ? "bg-emerald-600" : "bg-slate-400"}`}>
                                              {filter.order ? `順序 ${filter.order}` : `參`}
                                            </span>
                                            <span className="px-2 py-0.5 text-slate-700 font-bold bg-white flex items-center gap-1">
                                              {filter.subject} <span className="text-emerald-600 font-extrabold text-xs">{filter.score}</span>
                                            </span>
                                          </div>
                                          {idx < t.cutoff_filters.length - 1 && <span className="text-slate-300 font-bold text-xs">➔</span>}
                                        </React.Fragment>
                                      ))
                                    ) : (
                                      <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 w-full text-left">
                                        {t.raw_cutoff_text || t.cutoff || "未提供詳細門檻說明"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs">該系組暫無歷史一階篩選資料。</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
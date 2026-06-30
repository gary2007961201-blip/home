import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CartButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  // 🔄 這裡非常酷：監聽 localstorage 或是路徑變更，隨時即時更新右上角/右下角的數量
  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem("selected_departments");
      if (saved) {
        const items = JSON.parse(saved);
        setCartCount(items.length);
      } else {
        setCartCount(0);
      }
    };

    updateCount();
    // 監聽自訂事件，當別的頁面新增/刪除時能即時閃動數量
    window.addEventListener("cartUpdated", updateCount);
    return () => window.removeEventListener("cartUpdated", updateCount);
  }, [location]); // 每次切換頁面也自動重新整理數量

  // ⚠️ 如果剛好在 /cart 頁面，就隱藏這顆懸浮按鈕，避免畫面重複
  if (location.pathname === "/cart") return null;

  return (
    <div 
        style={{
            position: "fixed",
            bottom: "90px",  // 👈 精準定位在 90px，完美疊在問題回報上方，不打架！
            right: "24px",   // 👈 對齊右邊距離
            zIndex: 50
        }}
    >
      <button
        onClick={() => navigate("/cart")}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all font-bold group scale-100 hover:scale-105"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        待篩選校系
        <span className="bg-white text-emerald-700 rounded-full px-2 py-0.5 text-xs font-black min-w-[20px] text-center">
          {cartCount}
        </span>
      </button>
    </div>
  );
}
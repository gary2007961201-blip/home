import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

function FeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // loading, success, error, limit
  const [isLimited, setIsLimited] = useState(false);

  // 🛡️ 設定每人每天的回報上限次數
  const DAILY_LIMIT = 3; 

  // 🔄 網頁載入時，檢查該使用者今天是否已經超額
  useEffect(() => {
    const today = new Date().toLocaleDateString("zh-TW"); // 取得今天日期（例如 "2026/6/23"）
    const localData = localStorage.getItem("feedback_limit");

    if (localData) {
      const { date, count } = JSON.parse(localData);
      // 如果紀錄的日期是今天，且次數大於等於上限，就鎖定
      if (date === today && count >= DAILY_LIMIT) {
        setIsLimited(true);
        setStatus("limit");
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || isLimited) return;

    setStatus("loading");

   const serviceId = "service_ttxfm2s";
   const templateId = "template_oceopgl";
   const publicKey = "gNUp6d8Z-8QVR_RDW";

    const templateParams = {
      message: message,
      submit_time: new Date().toLocaleString("zh-TW"),
    };

    emailjs.send(serviceId, templateId, templateParams, publicKey)
      .then(() => {
        setStatus("success");
        setMessage(""); 

        // 📈 成功送出後，更新 localStorage 的次數
        const today = new Date().toLocaleDateString("zh-TW");
        const localData = localStorage.getItem("feedback_limit");
        let currentCount = 0;

        if (localData) {
          const { date, count } = JSON.parse(localData);
          if (date === today) currentCount = count; // 如果是今天，累加次數
        }

        const newCount = currentCount + 1;
        localStorage.setItem("feedback_limit", JSON.stringify({ date: today, count: newCount }));

        // 如果這次送出剛好達到上限，立刻鎖定
        if (newCount >= DAILY_LIMIT) {
          setIsLimited(true);
        }

        setTimeout(() => {
          setIsOpen(false);
          if (newCount >= DAILY_LIMIT) {
            setStatus("limit");
          } else {
            setStatus("");
          }
        }, 2000);
      })
      .catch((err) => {
        console.error("EmailJS Error:", err);
        setStatus("error");
      });
  };

  return (
    <>
      {/* 1. 右下角固定懸浮按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "85px",
          right: "24px",
          backgroundColor: isLimited ? "#9ca3af" : "#4f46e5", // 超額時按鈕變灰色
          color: "white",
          border: "none",
          borderRadius: "50px",
          padding: "12px 20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          cursor: "pointer",
          fontWeight: "bold",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span>💬 {isLimited ? "回報已達上限" : "問題回報"}</span>
      </button>

      {/* 2. 點擊後跳出的小對話框 */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "145px",
            right: "24px",
            width: "320px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            padding: "16px",
            zIndex: 9999,
            fontFamily: "sans-serif"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, color: "#1f2937" }}>歡迎回報任何問題</h4>
          </div>

          {status === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#16a34a", fontWeight: "bold" }}>
              🎉 收到囉！謝謝你的意見！
            </div>
          )}

          {status === "limit" && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#ea580c", fontSize: "14px", fontWeight: "bold" }}>
              ⚠️ 您今天的回報次數已達上限 ({DAILY_LIMIT}次)，請留給其他有需要的人，明天再試試看喔！
            </div>
          )}

          {status !== "success" && status !== "limit" && (
            <form onSubmit={handleSubmit}>
              <textarea
                placeholder="例如：歷屆分數錯誤、網站功能出錯或不足、UI設計、(或你/妳只是想講點話)..."
                required
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  resize: "none",
                  boxSizing: "border-box",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <div style={{ display: "flex", justifyContent: "end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#4b5563",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={status === "loading" || !message.trim()}
                  style={{
                    backgroundColor: status === "loading" ? "#9ca3af" : "#4f46e5",
                    color: "white",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    cursor: message.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  {status === "loading" ? "傳送中..." : "送出"}
                </button>
              </div>
            </form>
          )}
          {status === "error" && (
            <p style={{ color: "#dc2626", fontSize: "12px", margin: "8px 0 0 0" }}>❌ 傳送失敗，請稍後再試</p>
          )}
        </div>
      )}
    </>
  );
}

export default FeedbackModal;
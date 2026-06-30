import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import School from "./pages/School";
import Cart from "./pages/Cart";
import FeedbackModal from "./components/FeedbackModal";
import CartButton from "./components/CartButton"; // 👈 完美引入我們剛剛寫的按鈕

function App() {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/school/:id" element={<School />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>

      {/* 📊 全站雙懸浮客服/工具組 */}
      <CartButton />      {/* 🟢 疊在上面 (bottom: 24px + 按鈕高度，算好 24分界) */}
      <FeedbackModal />  {/* 🔵 在最下面 (請確保你裡面的樣式 bottom 已經改成 24px) */}
    </div>
  );
}

export default App;
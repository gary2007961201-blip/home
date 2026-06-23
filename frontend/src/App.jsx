import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import School from "./pages/School";
import Cart from "./pages/Cart";
import FeedbackModal from "./components/FeedbackModal"; // 👈 引入等一下要做的回報小視窗

function App() {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/school/:id" element={<School />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>

      {/* 💬 全站全自動懸浮意見回報鈕 */}
      <FeedbackModal />
    </div>
  );
}

export default App;
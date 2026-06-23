import { useState } from "react";

function ScoreInput({ onCalculate }) {
  const [chinese, setChinese] = useState("");
  const [english, setEnglish] = useState("");
  const [mathA, setMathA] = useState("");
  const [science, setScience] = useState("");

  const handleClick = () => {
    const total =
      (Number(chinese) || 0) +
      (Number(english) || 0) +
      (Number(mathA) || 0) +
      (Number(science) || 0);

    onCalculate(total);
  };

  return (
    <div>
      <h3>輸入學測級分</h3>

      <input placeholder="國文" onChange={(e) => setChinese(e.target.value)} />
      <input placeholder="英文" onChange={(e) => setEnglish(e.target.value)} />
      <input placeholder="數A" onChange={(e) => setMathA(e.target.value)} />
      <input placeholder="自然" onChange={(e) => setScience(e.target.value)} />

      <br /><br />

      <button onClick={handleClick}>計算落點</button>
    </div>
  );
}

export default ScoreInput;
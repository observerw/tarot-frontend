import { Circle, Home, User } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [selectedCard, setSelectedCard] = useState(false);

  const handleCardClick = () => {
    setSelectedCard(!selectedCard);
  };

  const handleThreeCardLayout = () => {
    console.log("三牌阵被选择");
    // 这里可以添加导航到三牌阵页面的逻辑
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1326] to-[#251543] text-white relative overflow-hidden">
      {/* 星空背景效果 */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{ top: "20%", left: "10%" }}
        ></div>
        <div
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{ top: "30%", left: "80%", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
          style={{ top: "60%", left: "20%", animationDelay: "2s" }}
        ></div>
        <div
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{ top: "80%", left: "70%", animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
          style={{ top: "40%", left: "60%", animationDelay: "1.5s" }}
        ></div>
      </div>

      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-[rgba(26,19,38,0.95)] backdrop-blur-sm">
        <div className="flex justify-between items-center p-4">
          <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <span className="text-lg">↩</span>
          </button>

          <h1 className="text-xl font-medium text-center flex-1">塔塔巫</h1>

          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <span className="text-lg">⋯</span>
            </button>
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <span className="text-lg">⚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="px-5 pb-20 flex flex-col items-center gap-8">
        {/* 卡片展示区域 */}
        <div
          className="w-full flex justify-center mt-8"
          style={{ perspective: "1000px" }}
        >
          <div className="w-[70%] max-w-[280px] aspect-[3/5] relative">
            {/* 卡片阴影效果 */}
            <div className="absolute -inset-2.5 rounded-2xl border border-white/10 bg-white/5"></div>

            {/* 塔罗牌 */}
            <div
              className={`w-full h-full rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-[0_15px_40px_rgba(102,51,153,0.4)] hover:-translate-y-1 ${
                selectedCard ? "transform" : ""
              }`}
              onClick={handleCardClick}
              style={{
                background: "linear-gradient(135deg, #251543 0%, #36204e 100%)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                transform: selectedCard ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* 卡片背面图案 */}
              <div className="w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="w-20 h-20 border-2 border-[#d4af37] rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border border-[#d4af37] rounded-full"></div>
                </div>

                {/* 光效动画 */}
                <div
                  className="absolute inset-0 transform rotate-12 -translate-x-full opacity-50"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
                    animation: "shimmer 5s infinite linear",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 提示文字 */}
        <div className="text-center max-w-[300px]">
          <h2 className="text-lg font-semibold mb-2">
            点击卡牌 揭示问题的答案
          </h2>
          <p className="text-sm text-[#b0a8c2]">
            塔罗的神秘世界中命运不再是未知的迷雾
          </p>
        </div>

        {/* 牌阵选择卡片 */}
        <div className="w-full flex flex-col gap-4 mt-5">
          {/* 三牌阵 */}
          <div
            className="flex bg-[rgba(25,16,50,0.7)] rounded-lg p-4 cursor-pointer border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:bg-[rgba(30,20,60,0.8)] gap-4 relative overflow-hidden"
            onClick={handleThreeCardLayout}
          >
            {/* 卡片图像 */}
            <div className="flex justify-center items-center w-15 h-20 relative">
              <div className="absolute w-7 h-11 bg-[#251543] rounded border border-[#d4af37] left-0 top-4 z-10 transform -rotate-12"></div>
              <div className="absolute w-7 h-11 bg-[#251543] rounded border border-[#d4af37] left-4 top-2 z-20"></div>
              <div className="absolute w-7 h-11 bg-[#251543] rounded border border-[#d4af37] left-8 top-4 z-30 transform rotate-12"></div>
            </div>

            {/* 卡片信息 */}
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-base font-semibold mr-2">三牌阵</h3>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-[#ff6b6b] text-white uppercase font-bold">
                  Hot
                </span>
              </div>
              <p className="text-sm text-white mb-1">过去 现在 未来</p>
              <p className="text-xs text-[#b0a8c2]">
                犹若流淌的时间从过去延伸到未来，事件平铺于时间轴之上
              </p>
            </div>
          </div>

          {/* 凯尔特十字 */}
          <div className="flex bg-[rgba(25,16,50,0.7)] rounded-lg p-4 cursor-pointer border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:bg-[rgba(30,20,60,0.8)] gap-4 relative overflow-hidden">
            {/* 卡片图像 */}
            <div className="flex justify-center items-center w-15 h-20">
              <div className="w-12 h-16 bg-[#251543] rounded border border-[#d4af37] flex items-center justify-center relative">
                {/* 十字图案 */}
                <div className="absolute w-6 h-0.5 bg-[#d4af37]"></div>
                <div className="absolute w-0.5 h-6 bg-[#d4af37]"></div>
              </div>
            </div>

            {/* 卡片信息 */}
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-base font-semibold mr-2">凯尔特十字</h3>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-[#5e72e4] text-white uppercase font-bold">
                  Pro
                </span>
              </div>
              <p className="text-sm text-white mb-1">全面解析 深度剖析</p>
              <p className="text-xs text-[#b0a8c2]">
                最经典的塔罗牌阵之一，全面而深入地分析问题的各个方面。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 底部导航 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[rgba(25,16,50,0.95)] backdrop-blur-sm border-t border-white/5 z-50">
        <nav className="flex justify-around py-3">
          <a
            href="#"
            className="flex flex-col items-center text-[#663399] no-underline"
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">探索</span>
          </a>
          <a
            href="#"
            className="flex flex-col items-center text-[#888] no-underline"
            onClick={(e) => e.preventDefault()}
          >
            <Circle className="w-6 h-6 mb-1" />
            <span className="text-xs">达人解牌</span>
          </a>
          <a
            href="#"
            className="flex flex-col items-center text-[#888] no-underline"
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">我的</span>
          </a>
        </nav>
      </footer>
    </div>
  );
};

export default Index;

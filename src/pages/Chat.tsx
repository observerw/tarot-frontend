import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  type: "system" | "user" | "bot";
  content: string;
  timestamp: Date;
}

interface TarotCard {
  id: string;
  name: string;
  position: string;
  image: string;
  reversed: boolean;
  flipped: boolean;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "system",
      content: "欢迎来到塔罗牌对话。请描述你想探索的问题，AI将为你提供指引。",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDrawButton, setShowDrawButton] = useState(false);
  const [tarotCards, setTarotCards] = useState<TarotCard[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // 模拟AI回复
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "我理解了你的问题。让我们开始抽牌来为你提供指引。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      setShowDrawButton(true);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDrawCards = () => {
    const mockCards: TarotCard[] = [
      {
        id: "1",
        name: "愚者",
        position: "过去",
        image: "/placeholder.svg",
        reversed: false,
        flipped: false,
      },
      {
        id: "2",
        name: "魔术师",
        position: "现在",
        image: "/placeholder.svg",
        reversed: true,
        flipped: false,
      },
      {
        id: "3",
        name: "女祭司",
        position: "未来",
        image: "/placeholder.svg",
        reversed: false,
        flipped: false,
      },
    ];

    setTarotCards(mockCards);
    setShowDrawButton(false);

    // 逐个翻牌动画
    mockCards.forEach((_, index) => {
      setTimeout(() => {
        setTarotCards((prev) =>
          prev.map((card, i) =>
            i === index ? { ...card, flipped: true } : card
          )
        );
      }, (index + 1) * 1000);
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1025] text-white">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-[#2c2039] border-b border-white/10">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="w-20">
            <button className="flex items-center text-[#673ab7] font-bold hover:text-[#9575cd] transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-medium">塔罗对话</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-4xl mx-auto">
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#2c2039] rounded-lg mx-4 my-4 shadow-lg overflow-hidden">
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 max-w-[80%] p-3 rounded-2xl relative animate-[fadeIn_0.3s] ${
                  message.type === "system"
                    ? "bg-[rgba(94,53,177,0.2)] text-white mx-auto max-w-[90%] rounded-lg text-center border border-[#673ab7]"
                    : message.type === "user"
                    ? "bg-[#673ab7] text-white ml-auto rounded-tr-none"
                    : "bg-[#2c2039] text-white mr-auto rounded-tl-none border border-[#673ab7]"
                }`}
              >
                <div className="message-content">{message.content}</div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}

            {/* 打字指示器 */}
            {isTyping && (
              <div className="flex items-center p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            )}

            {/* 塔罗牌区域 */}
            {tarotCards.length > 0 && (
              <div className="flex flex-wrap justify-center p-4 gap-4 bg-[rgba(94,53,177,0.2)] rounded-lg my-4">
                {tarotCards.map((card) => (
                  <div key={card.id} className="relative">
                    {/* 位置标签 */}
                    <div className="absolute -top-6 left-0 right-0 text-center text-sm text-[#673ab7] bg-white/80 py-1 px-2 rounded-lg font-bold">
                      {card.position}
                    </div>

                    {/* 塔罗牌 */}
                    <div
                      className="w-24 h-36 mx-2 relative"
                      style={{ perspective: "1000px" }}
                    >
                      <div
                        className="w-full h-full transition-transform duration-800 relative"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: card.flipped
                            ? "rotateY(180deg)"
                            : "rotateY(0deg)",
                        }}
                      >
                        {/* 卡片正面 */}
                        <div
                          className="absolute w-full h-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-[#3a1c71] via-[#d76d77] to-[#ffaf7b] flex items-center justify-center"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="w-16 h-16 opacity-20">
                            <svg viewBox="0 0 24 24" fill="white">
                              <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.6h7.6z" />
                            </svg>
                          </div>
                        </div>

                        {/* 卡片背面 */}
                        <div
                          className={`absolute w-full h-full rounded-lg overflow-hidden shadow-lg bg-white flex flex-col ${
                            card.reversed ? "rotate-180" : ""
                          }`}
                          style={{
                            backfaceVisibility: "hidden",
                            transform: `rotateY(180deg) ${
                              card.reversed ? "rotate(180deg)" : ""
                            }`,
                          }}
                        >
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                            {card.name}
                          </div>
                          {card.reversed && (
                            <div className="absolute top-1 right-1 bg-[#ff9800] text-white text-xs px-1 py-0.5 rounded font-bold">
                              逆位
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 抽牌按钮 */}
          {showDrawButton && (
            <div className="p-4 text-center border-t border-white/10">
              <button
                onClick={handleDrawCards}
                className="bg-[#673ab7] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#9575cd] transition-colors"
              >
                开始抽牌
              </button>
            </div>
          )}

          {/* 输入区域 */}
          <div className="flex p-4 border-t border-white/10">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入你的问题..."
              className="flex-1 border border-[#673ab7] rounded-3xl px-4 py-3 resize-none h-14 bg-[#2c2039] text-white placeholder-gray-400 outline-none focus:border-[#673ab7] transition-colors"
            />
            <button
              onClick={handleSendMessage}
              className="bg-[#673ab7] text-white w-14 h-14 rounded-full ml-3 flex items-center justify-center hover:bg-[#9575cd] transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;

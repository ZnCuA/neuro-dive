import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, Activity, MessageSquare, Key } from 'lucide-react';

// --- 0. Gemini API 配置 ---
const apiKey = ""; // 运行时环境会自动提供 API Key

// API 调用辅助函数 (带重试机制)
const callGemini = async (prompt, systemInstruction) => {
  const maxRetries = 3;
  let retryCount = 0;
  let currentDelay = 1000;

  const attemptRequest = async (delay) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "数据流损坏...无法解析响应。";
    } catch (error) {
      console.error("Gemini API request failed:", error);
      throw error;
    }
  };

  while (retryCount < maxRetries) {
    try {
      return await attemptRequest(currentDelay);
    } catch (error) {
      retryCount++;
      if (retryCount === maxRetries) return "连接超时。神经链路不稳定。";
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 2; // 指数退避
    }
  }
};

// --- 1. 样式与动画定义 ---
const styles = `
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes flicker {
    0% { opacity: 0.97; }
    5% { opacity: 0.9; }
    10% { opacity: 0.95; }
    15% { opacity: 0.85; }
    20% { opacity: 0.98; }
    100% { opacity: 0.95; }
  }
  @keyframes glitch-anim-1 {
    0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
    20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
    40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
    60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
    80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
    100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
  }
  .crt-scanline {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
    background-size: 100% 4px;
    pointer-events: none;
  }
  .crt-overlay::before {
    content: " ";
    display: block;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    z-index: 2;
    background-size: 100% 2px, 3px 100%;
    pointer-events: none;
  }
  .crt-flicker {
    animation: flicker 0.15s infinite;
  }
  .text-shadow-glow {
    text-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
  }
  .text-shadow-error {
    text-shadow: 0 0 5px rgba(239, 68, 68, 0.8);
  }
  .text-shadow-ai {
    text-shadow: 0 0 8px rgba(167, 139, 250, 0.6);
  }
  .glitch-active {
    animation: glitch-anim-1 0.3s infinite linear alternate-reverse;
  }
`;

// --- 2. 剧情脚本数据 (Data Layer) ---
const SCRIPTS = {
  boot: [
    { text: "> 初始化神经链路协议 (NDP-v0.9)...", delay: 500 },
    { text: "> 正在挂载突触驱动...", delay: 800 },
    { text: "> [警告] 检测到未授权的意识潜入。", type: "warning", delay: 1200 },
    { text: "> 绕过安全协议... 成功。", type: "success", delay: 1500 },
    { text: "> 欢迎回来，潜渊者。", delay: 2000 }
  ],
  firewallIntro: [
    { text: "> 正在连接目标节点：[Sector-7 废弃数据塔]...", delay: 1000 },
    { text: "> 连接被拒绝。检测到 ICE (入侵对抗电子系统)。", type: "error", delay: 1500 },
    { text: "> 分析 ICE 类型... 动态频率锁。", delay: 2000 },
    { text: "> 任务：需要在信号波峰同步时注入数据包。", type: "info", delay: 2500 }
  ],
  neonIntro: [
    { text: "> 防火墙已突破。进入内网层。", type: "success", delay: 1000 },
    { text: "> 环境渲染中... [霓虹市下层街区]。", delay: 1500 },
    { text: "> 你站在雨中的数据流街头。面前是一个闪烁的全息招牌。", delay: 2500 },
    { text: "> 招牌背后隐藏着管理员端口。我们需要扫描正确的端口号。", type: "info", delay: 3500 },
    { text: "> 提示：端口范围 1000 - 9999。", delay: 4000 }
  ],
  ending: [
    { text: "> [系统异常] 检测到外部追踪信号！！", type: "error", delay: 1000 }, // 延迟减少，因为前面有动态生成的内容
    { text: ">> 它们发现你了。", type: "glitch", delay: 1500 },
    { text: ">> 快跑。", type: "glitch", delay: 2000 },
    { text: "FATAL ERROR: NEURAL LINK SEVERED.", type: "error", delay: 3000 }
  ]
};

// --- 3. 子组件 ---

// 3.1 单行文本组件
const LogLine = ({ entry }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let i = 0;
    if (!entry.text) return;
    
    const speed = entry.type === 'glitch' ? 10 : 20;
    
    const timer = setInterval(() => {
      if (i < entry.text.length) {
        setDisplayedText(entry.text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [entry]);

  let colorClass = "text-green-400";
  if (entry.type === "error" || entry.type === "glitch") colorClass = "text-red-500 font-bold text-shadow-error";
  if (entry.type === "warning") colorClass = "text-yellow-400";
  if (entry.type === "success") colorClass = "text-blue-400";
  if (entry.type === "info") colorClass = "text-cyan-300";
  if (entry.type === "ai") colorClass = "text-purple-300 text-shadow-ai italic"; // AI 回复样式

  return (
    <div className={`mb-2 font-mono text-sm md:text-base break-words ${colorClass} ${entry.type === 'glitch' ? 'glitch-active' : ''}`}>
      {entry.type === 'ai' && <span className="mr-2 not-italic">✨ GHOST:</span>}
      {displayedText}
    </div>
  );
};

// 3.2 谜题：防火墙时机
const FirewallPuzzle = ({ onSolve, onFail }) => {
  const [pos, setPos] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState("ACTIVE");
  
  useEffect(() => {
    if (status !== "ACTIVE") return;
    const interval = setInterval(() => {
      setPos(p => {
        if (p >= 100) { setDirection(-1); return 99; }
        if (p <= 0) { setDirection(1); return 1; }
        return p + (direction * 2.5); 
      });
    }, 16);
    return () => clearInterval(interval);
  }, [status, direction]);

  const handleInject = () => {
    if (status !== "ACTIVE") return;
    if (pos >= 70 && pos <= 90) {
      setStatus("SUCCESS");
      setTimeout(onSolve, 1000);
    } else {
      setStatus("FAIL");
      setTimeout(() => {
        setPos(0);
        setStatus("ACTIVE");
        onFail();
      }, 1000);
    }
  };

  return (
    <div className="mt-4 border border-green-800 p-4 bg-black/50">
      <div className="text-xs text-green-600 mb-2">ICE_BREAKER_TOOL.EXE</div>
      <div className="text-green-400 mb-2 text-center">
        {status === "ACTIVE" && "等待信号同步..."}
        {status === "SUCCESS" && "注入成功！"}
        {status === "FAIL" && "同步失败！重试中..."}
      </div>
      <div className="relative w-full h-8 bg-gray-900 border border-gray-700 rounded overflow-hidden">
        <div className="absolute top-0 bottom-0 bg-yellow-900/50 border-l border-r border-yellow-600" style={{ left: '70%', width: '20%' }}></div>
        <div 
          className={`absolute top-0 bottom-0 w-2 transition-none ${status === 'FAIL' ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ left: `${pos}%` }}
        ></div>
      </div>
      <button 
        onClick={handleInject}
        className="mt-4 w-full py-3 bg-green-900/30 border border-green-600 text-green-400 hover:bg-green-800/50 font-bold tracking-widest uppercase"
      >
        [ INITIATE_INJECTION ]
      </button>
    </div>
  );
};

// 3.3 谜题：High/Low 端口扫描
const PortPuzzle = ({ onSolve }) => {
  const [target] = useState(() => Math.floor(Math.random() * (8000)) + 1000);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("等待输入端口号...");
  const [history, setHistory] = useState([]);

  const handleScan = () => {
    const val = parseInt(guess);
    if (isNaN(val)) return;
    
    let msg = "";
    let type = "";
    
    if (val === target) {
      msg = `端口 ${val}: 访问已授权。`;
      type = "success";
      setFeedback(msg);
      setTimeout(onSolve, 1500);
    } else if (val < target) {
      msg = `端口 ${val}: 信号过弱 (TOO LOW)`;
      type = "low";
    } else {
      msg = `端口 ${val}: 频率溢出 (TOO HIGH)`;
      type = "high";
    }
    
    if (type !== "success") {
      setFeedback(msg);
      setHistory([msg, ...history].slice(0, 3));
      setGuess("");
    }
  };

  return (
    <div className="mt-4 border border-cyan-800 p-4 bg-black/50">
      <div className="text-xs text-cyan-600 mb-2">PORT_SCANNER_V2.0</div>
      <div className="flex flex-col gap-2">
        <div className="font-mono text-cyan-300 text-lg text-center mb-2 border-b border-cyan-900 pb-2">
          {feedback}
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="输入端口 (1000-9999)"
            className="flex-1 bg-black border border-cyan-700 text-cyan-400 p-2 font-mono focus:outline-none focus:border-cyan-400"
          />
          <button 
            onClick={handleScan}
            className="px-4 bg-cyan-900/30 border border-cyan-600 text-cyan-400 hover:bg-cyan-800/50"
          >
            [ SCAN ]
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 font-mono">
          {history.map((h, i) => <div key={i} className="opacity-70">{'>'} {h}</div>)}
        </div>
      </div>
    </div>
  );
};

// --- 4. 主应用程序 ---

export default function NeuroDiveApp() {
  const [scene, setScene] = useState("boot"); // boot, firewall, neon, ending
  const [logs, setLogs] = useState([]);
  const [showControls, setShowControls] = useState(false);
  
  // AI 交互状态
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);

  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [logs]);

  const addLog = useCallback((item) => {
    setLogs(prev => [...prev, { ...item, id: Date.now() + Math.random() }]);
    scrollToBottom();
  }, []);

  const playScript = useCallback(async (scriptName) => {
    setShowControls(false);
    const script = SCRIPTS[scriptName];
    if (!script) return;

    for (let line of script) {
      addLog(line);
      await new Promise(r => setTimeout(r, line.delay || 1000));
    }
    setShowControls(true);
  }, [addLog]);

  // --- 状态机逻辑 ---

  useEffect(() => {
    if (scene === 'boot') {
      playScript('boot');
    }
  }, [scene, playScript]);

  // 场景跳转
  const handleCommand = (cmd) => {
    addLog({ text: `>> USER_INPUT: ${cmd}`, type: "info" });
    
    if (cmd === 'CONNECT_SERVER' && scene === 'boot') {
      setScene('firewall');
      setLogs([]);
      playScript('firewallIntro');
    }
  };

  // ✨ AI 功能：处理用户手动输入
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    const input = manualInput;
    setManualInput("");
    addLog({ text: `> ${input}`, type: "info" });
    setIsAILoading(true);

    // 构建 Prompt
    const systemPrompt = `你是一个赛博朋克风格的文字冒险游戏中的 AI 助手，名字叫 "GHOST"。
    当前场景: ${scene}。
    用户正在扮演一名黑客。
    请用简短、技术化、略带神秘感的语气回答用户的指令。
    如果用户询问提示，根据当前场景给出隐晦的线索。
    限制在 60 字以内。不要使用 markdown。`;

    const aiResponse = await callGemini(input, systemPrompt);
    
    setIsAILoading(false);
    addLog({ text: aiResponse, type: "ai" });
  };

  const onFirewallSolved = () => {
    addLog({ text: "> ICE 防火墙已瘫痪。", type: "success" });
    setTimeout(() => {
      setScene('neon');
      setLogs([]);
      playScript('neonIntro');
    }, 1500);
  };

  const onFirewallFailed = () => {
    addLog({ text: "> 注入时机错误。警报等级提升。", type: "error" });
  };

  // ✨ AI 功能：动态生成解密内容
  const onPortSolved = async () => {
    setShowControls(false);
    addLog({ text: "> 端口接入成功。正在解密底层数据...", type: "success" });
    
    // 调用 AI 生成独特的“真相”
    const systemPrompt = "生成一段赛博朋克风格的绝密文件内容。内容关于'NeuroDive计划'的黑暗真相（如人体实验、意识上传失败等）。格式类似：'日志 #402: ...'。语气惊悚、碎片化。限制 80 字。";
    const secretContent = await callGemini("Generate secret log", systemPrompt);
    
    addLog({ text: secretContent, type: "ai" });
    
    setTimeout(() => {
      setScene('ending');
      playScript('ending');
    }, 4000); // 给用户时间阅读生成的内容
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden selection:bg-green-900 selection:text-white">
      <style>{styles}</style>
      
      <div className={`fixed inset-0 crt-scanline z-50 pointer-events-none ${scene === 'ending' ? 'glitch-active' : ''}`}></div>
      <div className="fixed inset-0 crt-overlay z-40 pointer-events-none"></div>
      
      {scene === 'ending' && (
        <div className="fixed inset-0 bg-red-900/20 z-0 animate-pulse"></div>
      )}

    <div className="relative z-10 flex flex-col min-h-screen md:h-screen max-w-3xl mx-auto p-4 md:p-8 crt-flicker">
        
        <header className="flex justify-between items-center border-b border-green-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Activity className={`${scene === 'ending' ? 'text-red-500' : 'text-green-400'} w-6 h-6`} />
            <h1 className="text-xl font-bold tracking-widest text-shadow-glow">
              NEURO_DIVE <span className="text-xs opacity-70">v2.0 AI-Core</span>
            </h1>
          </div>
          <div className="text-xs text-right opacity-70">
            <div>MEM: 64TB</div>
            <div>AI_MODULE: {isAILoading ? 'PROCESSING...' : 'ONLINE'}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto mb-4 pr-2 scrollbar-hide">
          {logs.map((entry) => (
            <LogLine key={entry.id} entry={entry} />
          ))}
          
          {isAILoading && (
             <div className="text-purple-400 text-sm animate-pulse">✨ GHOST is analyzing...</div>
          )}

          {showControls && scene === 'firewall' && (
            <FirewallPuzzle onSolve={onFirewallSolved} onFail={onFirewallFailed} />
          )}
          
          {showControls && scene === 'neon' && (
            <PortPuzzle onSolve={onPortSolved} />
          )}

          {scene === 'ending' && logs.length > 5 && (
            <div className="mt-12 text-center">
              <div className="text-6xl font-black text-red-600 glitch-active mb-4">SYSTEM FAILURE</div>
              <button onClick={() => window.location.reload()} className="text-red-400 border border-red-600 px-6 py-2 hover:bg-red-900/50">
                [ REBOOT_SYSTEM ]
              </button>
            </div>
          )}

          <div ref={logsEndRef} />
        </main>

        <footer className="border-t border-green-800 pt-4">
          {/* 标准按钮区域 */}
          {!manualMode && showControls && scene === 'boot' && (
            <div className="flex gap-4 justify-center mb-4">
              <button 
                onClick={() => handleCommand('CONNECT_SERVER')}
                className="group relative px-6 py-2 border border-green-600 overflow-hidden"
              >
                <div className="absolute inset-0 w-0 bg-green-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-20"></div>
                <span className="relative flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  [ INITIATE_LINK ]
                </span>
              </button>
            </div>
          )}

          {/* ✨ AI 输入区域 (Manual Mode) */}
          {manualMode && (
            <form onSubmit={handleManualSubmit} className="mb-4 flex gap-2">
              <span className="text-purple-400 self-center whitespace-nowrap">GHOST_SHELL {'>'}</span>
              <input 
                autoFocus
                type="text" 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 bg-transparent border-b border-purple-500 focus:outline-none text-purple-300 placeholder-purple-700"
                placeholder="输入指令..."
              />
              <button type="submit" disabled={isAILoading} className="text-purple-400 hover:text-purple-200">
                <Key className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 底部状态栏与切换开关 */}
          <div className="flex items-center justify-between text-xs opacity-50 gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${scene === 'ending' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                {scene.toUpperCase()}
              </div>
              {/* ✨ 切换按钮 */}
              <button 
                onClick={() => setManualMode(!manualMode)}
                className="flex items-center gap-1 hover:text-green-300 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                [{manualMode ? 'DISABLE_CLI' : 'MANUAL_OVERRIDE'}]
              </button>
            </div>
            <div>UID: 0x99_AF_22</div>
          </div>
        </footer>

      </div>
    </div>
  );
}

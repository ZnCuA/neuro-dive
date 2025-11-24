import React from 'react';
import { X } from 'lucide-react';

export default function ChoiceModal({ choices = [], title, onSelect, onClose }) {
  if (!choices || choices.length === 0) return null;
  
  const handleChoice = (choice) => {
    if (onSelect) {
      onSelect(choice);
    }
    if (onClose && choice?.closeOnSelect !== false) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-black/95 border-2 border-cyan-500 rounded-lg shadow-[0_0_40px_rgba(0,255,255,0.6)] overflow-hidden">
          {/* 弹窗标题栏 */}
          <div className="px-6 py-4 border-b-2 border-cyan-500 bg-cyan-950/30 flex items-center justify-between">
            <h3 className="text-cyan-400 font-bold text-lg font-mono">{title || '选择行动'}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* 选项列表 */}
          <div className="p-6">
            <div className="space-y-3">
              {choices.map((choice, idx) => {
                return (
                  <button
                    key={choice.id || idx}
                    onClick={() => handleChoice(choice)}
                    className="w-full group relative px-6 py-4 border-2 border-cyan-500 bg-black/50 hover:bg-cyan-500 hover:text-black transition-all text-left font-mono flex items-center gap-3 shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.8)] hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-cyan-400 group-hover:text-black font-bold text-lg">▶</span>
                    <span className="relative z-10 text-cyan-300 group-hover:text-black text-base font-semibold flex-1">
                      {choice.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

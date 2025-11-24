import React from 'react';
import { X } from 'lucide-react';

export default function PuzzleModal({ puzzleType, puzzleComponent, onSolve, onClose }) {
  if (!puzzleComponent) return null;
  
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
            <h3 className="text-cyan-400 font-bold text-lg font-mono">解密挑战</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* 解密内容 */}
          <div className="p-6 bg-transparent">
            <div className="w-full">
              {puzzleComponent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

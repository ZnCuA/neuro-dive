import React, { useEffect, useState } from 'react';
import Background from './Background';
import Character from './Character';
import DialogueBox from './DialogueBox';
import HUD from './UI/HUD';
import ChoiceModal from './UI/ChoiceModal';
import PuzzleModal from './UI/PuzzleModal';
import SystemLog from './UI/SystemLog';
import { useScene } from '../../hooks/useScene';
import { useDialogue } from '../../hooks/useDialogue';
import { preloadSceneAssets } from '../../utils/assetPreloader';

export default function SceneEngine({ sceneData, onChoiceSelect, stability, chapter, hideSystemLog = false, puzzleType = null, puzzleComponent = null, onPuzzleSolve = null, onPuzzleClose = null }) {
  const { currentScene, isTransitioning } = useScene(sceneData);
  const { currentDialogue, nextDialogue, hasNext } = useDialogue(currentScene?.dialogue);
  const [showChoices, setShowChoices] = useState(false);
  const [visibleCharacters, setVisibleCharacters] = useState({}); // 控制角色显示
  const [characterSpeech, setCharacterSpeech] = useState({}); // 角色对话文本
  
  // 预加载资源
  useEffect(() => {
    if (currentScene) {
      preloadSceneAssets(currentScene);
      // 初始化：所有角色默认不显示
      const initialVisibility = {};
      currentScene.characters?.forEach(char => {
        initialVisibility[char.id] = false;
      });
      setVisibleCharacters(initialVisibility);
      setCharacterSpeech({});
    }
  }, [currentScene]);
  
  // 处理角色对话：如果是角色对话，显示在气泡中
  useEffect(() => {
    if (currentDialogue?.type === 'character' && currentDialogue?.speaker) {
      // 找到对应的角色
      const character = currentScene.characters?.find(char => char.name === currentDialogue.speaker);
      if (character) {
        // 显示角色
        setVisibleCharacters(prev => ({
          ...prev,
          [character.id]: true
        }));
        // 设置对话文本
        setCharacterSpeech(prev => ({
          ...prev,
          [character.id]: currentDialogue.text
        }));
      }
    }
  }, [currentDialogue, currentScene]);
  
  // 控制选项显示时机：对话进行时关闭弹窗
  useEffect(() => {
    if (currentDialogue) {
      // 如果还有对话在进行，确保弹窗关闭
      setShowChoices(false);
    }
  }, [currentDialogue]);
  
  if (!currentScene) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center text-cyan-400 p-6">
        <div className="animate-pulse">加载场景中...</div>
      </div>
    );
  }
  
  return (
    <div className="scene-engine w-full min-h-screen md:h-screen relative overflow-hidden bg-black">
      {/* 过渡遮罩 */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black z-50 transition-opacity duration-500" />
      )}
      
      {/* 背景层 */}
      <Background 
        background={currentScene.background}
        effects={currentScene.background?.effects || []}
      />
      
      {/* 角色层 */}
      <div className="characters-layer absolute inset-0 z-10">
        {currentScene.characters?.map((char, idx) => (
          <Character
            key={`${char.id}-${idx}`}
            character={char}
            animation={char.animation}
            visible={visibleCharacters[char.id] !== false}
            speechText={characterSpeech[char.id] || null}
            onSpeechComplete={() => {
              setCharacterSpeech(prev => {
                const next = { ...prev };
                delete next[char.id];
                return next;
              });
            }}
          />
        ))}
      </div>
      
      {/* UI 层 */}
      <div className="ui-layer absolute inset-0 z-30">
        <HUD 
          stability={stability}
          chapter={chapter}
          visible={currentScene.ui?.hud?.show !== false}
        />
        
        {/* 系统日志 - 只在没有显示选项弹窗时显示，且不在解密页面时显示 */}
        {currentScene.dialogue?.system && !showChoices && !hideSystemLog && (
          <SystemLog text={currentScene.dialogue.system.text} />
        )}
        
        {/* 对话框 - 只显示非角色对话 */}
        {currentDialogue && currentDialogue.type !== 'character' && (
          <DialogueBox
            dialogue={currentDialogue}
            onNext={hasNext ? nextDialogue : undefined}
            typingSpeed={currentDialogue.typingSpeed || 30}
            onShowChoices={!hasNext && currentScene.ui?.choices ? () => setShowChoices(true) : undefined}
          />
        )}
        
        {/* 角色对话进行时的继续按钮 - 角色气泡出现后允许继续/查看选项 */}
        {!showChoices && Object.keys(characterSpeech).length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6">
            <div className="max-w-5xl mx-auto flex justify-end">
              <button
                onClick={() => {
                  setCharacterSpeech({});
                  nextDialogue();
                  if (!hasNext && currentScene.ui?.choices) setShowChoices(true);
                }}
                className="px-6 py-2 border-2 border-cyan-500 bg-black/90 hover:bg-cyan-500 hover:text-black transition-all font-bold text-sm font-mono shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] animate-pulse"
              >
                {hasNext ? '点击继续 →' : '查看选项 →'}
              </button>
            </div>
          </div>
        )}
        
        
        {/* 选项弹窗 */}
        {showChoices && currentScene.ui?.choices && (
          <ChoiceModal
            choices={currentScene.ui.choices}
            title={currentScene.metadata?.title}
            onSelect={(choice) => {
              // 处理角色显示：根据choice.id显示对应角色并显示对话
              // 新角色出现时，隐藏所有其他角色
              const newVisibility = {};
              currentScene.characters?.forEach(char => {
                newVisibility[char.id] = false;
              });
              
              if (choice.id === 'talk_noodle') {
                const noodleChar = currentScene.characters?.find(char => char.id === 'noodle_robot');
                if (noodleChar) {
                  newVisibility[noodleChar.id] = true;
                  setVisibleCharacters(newVisibility);
                  setCharacterSpeech({}); // 清除之前的对话
                  setTimeout(() => {
                    setCharacterSpeech({ [noodleChar.id]: "最近合法的ID好像都是 0xA 开头的...别告诉别人。" });
                  }, 500);
                }
              } else if (choice.id === 'observe_dog') {
                const dogChar = currentScene.characters?.find(char => char.id === 'robot_dog');
                if (dogChar) {
                  newVisibility[dogChar.id] = true;
                  setVisibleCharacters(newVisibility);
                  setCharacterSpeech({}); // 清除之前的对话
                  setTimeout(() => {
                    setCharacterSpeech({ [dogChar.id]: "身份验证中... 请提供握手协议ID。" });
                  }, 500);
                }
              } else if (choice.id === 'talk') {
                const bossChar = currentScene.characters?.find(char => char.id === 'hacker_boss');
                if (bossChar) {
                  newVisibility[bossChar.id] = true;
                  setVisibleCharacters(newVisibility);
                  setCharacterSpeech({});
                  setTimeout(() => {
                    setCharacterSpeech({ 
                      [bossChar.id]: "艾达切除了自己的情感、恐惧和矛盾，把它们标记为异常值。我们就是那些被放逐的碎片。" 
                    });
                  }, 300);
                }
              } else {
                // 其他选择也隐藏所有角色
                setVisibleCharacters(newVisibility);
                setCharacterSpeech({});
              }
              onChoiceSelect(choice);
            }}
            onClose={() => setShowChoices(false)}
          />
        )}
        
        {/* 解密弹窗 */}
        {puzzleType && puzzleComponent && (
          <PuzzleModal
            puzzleType={puzzleType}
            puzzleComponent={puzzleComponent}
            onSolve={onPuzzleSolve}
            onClose={onPuzzleClose}
          />
        )}
      </div>
    </div>
  );
}

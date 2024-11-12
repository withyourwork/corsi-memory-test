// CorsiTest.js
import React, { useState, useEffect } from 'react';

const CorsiTest = () => {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(3);
  const [startingLevel, setStartingLevel] = useState(3);
  const [attempts, setAttempts] = useState(0);
  const [gameStatus, setGameStatus] = useState('ready');
  const [isReverse, setIsReverse] = useState(false);
  const [errorLog, setErrorLog] = useState({});
  const [blockPositions, setBlockPositions] = useState([]);
  const [displaySequence, setDisplaySequence] = useState([]);

  const maxBlocks = 9;
  const attemptsPerLevel = 3;
  const boardSize = 384;
  const blockSize = 48;
  const duplicateChance = 0.1; // 10% 機率允許重複亮燈

  const generateBlockPositions = () => {
    const positions = [];
    const gridSize = 3;
    const cellSize = boardSize / gridSize;
    const blockPadding = 20;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellCenterX = col * cellSize + cellSize / 2;
        const cellCenterY = row * cellSize + cellSize / 2;

        const randomOffsetX = (Math.random() - 0.5) * cellSize * 0.8;
        const randomOffsetY = (Math.random() - 0.5) * cellSize * 0.8;

        let x = Math.max(
          blockPadding,
          Math.min(cellCenterX + randomOffsetX, boardSize - blockSize - blockPadding)
        );
        let y = Math.max(
          blockPadding,
          Math.min(cellCenterY + randomOffsetY, boardSize - blockSize - blockPadding)
        );

        let isValidPosition = true;
        for (const pos of positions) {
          const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
          if (distance < blockSize * 1.5) {
            isValidPosition = false;
            break;
          }
        }

        if (!isValidPosition) {
          for (let attempt = 0; attempt < 10; attempt++) {
            const newRandomX = (Math.random() - 0.5) * cellSize * 0.8;
            const newRandomY = (Math.random() - 0.5) * cellSize * 0.8;

            x = Math.max(
              blockPadding,
              Math.min(cellCenterX + newRandomX, boardSize - blockSize - blockPadding)
            );
            y = Math.max(
              blockPadding,
              Math.min(cellCenterY + newRandomY, boardSize - blockSize - blockPadding)
            );

            isValidPosition = true;
            for (const pos of positions) {
              const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
              if (distance < blockSize * 1.5) {
                isValidPosition = false;
                break;
              }
            }

            if (isValidPosition) break;
          }
        }

        if (isValidPosition) {
          positions.push({
            id: row * gridSize + col,
            x: x,
            y: y,
          });
        }
      }
    }

    return positions;
  };

  const generateSequence = (level) => {
    let sequence = [];
    let availableBlocks = Array.from({ length: 9 }, (_, i) => i);

    for (let i = 0; i < level; i++) {
      let blockIndex;
      if (Math.random() < duplicateChance && sequence.length > 0) {
        blockIndex = sequence[Math.floor(Math.random() * sequence.length)];
      } else {
        const index = Math.floor(Math.random() * availableBlocks.length);
        blockIndex = availableBlocks[index];
        availableBlocks.splice(index, 1);
      }
      sequence.push(blockIndex);
    }

    return sequence;
  };

  const playSequence = async () => {
    setCurrentLevel(startingLevel); // 設定初始等級
    setGameStatus('playing');
    setUserSequence([]);
    setBlockPositions(generateBlockPositions());

    const newSequence = generateSequence(startingLevel);
    setSequence(newSequence);

    const sequenceToDisplay = isReverse ? [...newSequence].reverse() : newSequence;
    setDisplaySequence(sequenceToDisplay);

    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let i = 0; i < sequenceToDisplay.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsPlaying(sequenceToDisplay[i]);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsPlaying(-1);
    }

    setGameStatus('input');
  };

  const handleBlockClick = (id) => {
    if (gameStatus !== 'input') return;

    const newUserSequence = [...userSequence, id];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      checkSequence(newUserSequence);
    }
  };

  const checkSequence = (userSeq) => {
    const sequenceToCompare = isReverse ? [...displaySequence].reverse() : displaySequence;
    const isCorrect = userSeq.every((block, index) => block === sequenceToCompare[index]);

    if (!isCorrect) {
      setErrorLog((prev) => ({
        ...prev,
        [currentLevel]: (prev[currentLevel] || 0) + 1,
      }));
      setGameStatus('retry');
      return;
    }

    setAttempts((prevAttempts) => {
      const newAttempts = prevAttempts + 1;
      if (newAttempts >= attemptsPerLevel) {
        if (currentLevel < maxBlocks) {
          setCurrentLevel((prevLevel) => prevLevel + 1);
          setAttempts(0);
        } else {
          setGameStatus('finished');
        }
      }
      return newAttempts;
    });

    setGameStatus('ready');
  };

  const resetGame = () => {
    setCurrentLevel(startingLevel);
    setAttempts(0);
    setSequence([]);
    setUserSequence([]);
    setDisplaySequence([]);
    setGameStatus('ready');
    setErrorLog({});
    setBlockPositions(generateBlockPositions());
  };

  const toggleMode = () => {
    if (gameStatus === 'ready') {
      setIsReverse(!isReverse);
      setBlockPositions(generateBlockPositions());
      setSequence([]);
      setUserSequence([]);
      setDisplaySequence([]);
    }
  };

  const handleRetry = () => {
    setUserSequence([]);
    setGameStatus('input');
  };

  const clearInput = () => {
    setUserSequence([]);
  };

  useEffect(() => {
    setBlockPositions(generateBlockPositions());
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">🧠 Corsi記憶力測試</h1>
        <div className="text-lg font-medium text-blue-600">
          {isReverse ? '⬆️ 倒序模式' : '⬇️ 順序模式'}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">當前等級</div>
            <div className="text-2xl font-bold text-blue-700">{currentLevel}個方塊</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600">當前嘗試</div>
            <div className="text-2xl font-bold text-green-700">{attempts + 1}/{attemptsPerLevel}</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-700 mr-2">選擇起始等級 (3-9)：</label>
          <input
            type="number"
            value={startingLevel}
            onChange={(e) => setStartingLevel(Math.max(3, Math.min(maxBlocks, Number(e.target.value))))}
            className="w-20 p-1 border rounded text-center"
            min={3}
            max={maxBlocks}
          />
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <button 
            onClick={toggleMode}
            disabled={gameStatus !== 'ready'}
            className={`px-4 py-2 text-sm font-medium rounded-md ${gameStatus === 'ready' ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}
          >
            切換{isReverse ? '順序' : '倒序'}模式
          </button>
          <button 
            onClick={resetGame}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
          >
            重新開始
          </button>
        </div>

        {gameStatus === 'ready' && (
          <button 
            onClick={playSequence}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none"
          >
            開始
          </button>
        )}

        {gameStatus === 'input' && userSequence.length > 0 && (
          <button 
            onClick={clearInput}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none"
          >
            清除輸入
          </button>
        )}
        
        {gameStatus === 'retry' && (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-red-600">順序錯誤！</div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleRetry}
                className="px-6 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none"
              >
                重新輸入
              </button>
              <button 
                onClick={() => setGameStatus('ready')}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                下一題
              </button>
            </div>
          </div>
        )}
        
        {gameStatus === 'finished' && (
          <div className="space-y-4">
            <div className="text-lg font-semibold">測試完成！</div>
            <button 
              onClick={resetGame}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              重新開始
            </button>
          </div>
        )}
      </div>
      
      <div className="relative w-96 h-96 mx-auto bg-gray-100 rounded-lg">
        {blockPositions.map(block => (
          <div
            key={block.id}
            onClick={() => handleBlockClick(block.id)}
            className={`absolute w-12 h-12 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${isPlaying === block.id ? 'bg-blue-500 scale-110' : 'bg-blue-200'} ${userSequence.includes(block.id) && gameStatus === 'input' ? 'bg-green-200' : ''} ${gameStatus === 'input' ? 'hover:bg-blue-300' : ''} ${gameStatus === 'retry' ? 'bg-red-200' : ''}`}
            style={{
              left: block.x,
              top: block.y,
              boxShadow: isPlaying === block.id ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none'
            }}
          />
        ))}
      </div>
      
      <div className="text-center mt-6 h-6 text-gray-600">
        {gameStatus === 'playing' && (
          <div className="animate-pulse">
            請記住方塊{isReverse ? '倒序' : '順序'}亮起的順序
          </div>
        )}
        {gameStatus === 'input' && (
          <div>
            請按照記憶中的{isReverse ? '倒序' : '順序'}點擊方塊 
            ({userSequence.length}/{sequence.length})
          </div>
        )}
        {gameStatus === 'retry' && (
          <div className="text-red-600">
            請選擇重新輸入或進入下一題
          </div>
        )}
      </div>

      {Object.keys(errorLog).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <div className="text-red-600 font-medium mb-2">錯誤記錄：</div>
          {Object.entries(errorLog).map(([level, count]) => (
            <div key={level} className="text-sm text-red-500">
              {level}個方塊：{count}次錯誤
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorsiTest;
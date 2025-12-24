
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { getAIMove } from '../services/aiService';

interface BlackjackGameProps {
  players: any[];
  localUser: User;
}

const BlackjackGame: React.FC<BlackjackGameProps> = ({ players, localUser }) => {
  const [playerCards, setPlayerCards] = useState<number[]>([]);
  const [dealerCards, setDealerCards] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Sua vez!');
  const [aiThinking, setAiThinking] = useState(false);

  const calculateScore = (cards: number[]) => {
    let score = cards.reduce((acc, card) => acc + (card > 10 ? 10 : card), 0);
    const hasAce = cards.includes(1);
    if (hasAce && score <= 11) score += 10;
    return score;
  };

  const dealCard = () => Math.floor(Math.random() * 11) + 1;

  const resetGame = () => {
    setPlayerCards([dealCard(), dealCard()]);
    setDealerCards([dealCard()]);
    setGameOver(false);
    setMessage('Sua vez!');
  };

  useEffect(() => {
    resetGame();
  }, []);

  const handleHit = () => {
    if (gameOver) return;
    const nextCard = dealCard();
    const newCards = [...playerCards, nextCard];
    setPlayerCards(newCards);
    if (calculateScore(newCards) > 21) {
      setGameOver(true);
      setMessage('Você Estourou! Dealer ganhou.');
    }
  };

  const handleStand = async () => {
    if (gameOver) return;
    setAiThinking(true);
    setMessage('Dealer está pensando...');

    // Simulate AI with Gemini
    const aiResponse = await getAIMove('Blackjack', {
      playerScore: calculateScore(playerCards),
      dealerScore: calculateScore(dealerCards),
      history: []
    });

    let currentDealerCards = [...dealerCards];
    while (calculateScore(currentDealerCards) < 17) {
      currentDealerCards.push(dealCard());
    }
    
    setDealerCards(currentDealerCards);
    setGameOver(true);
    setAiThinking(false);

    const pScore = calculateScore(playerCards);
    const dScore = calculateScore(currentDealerCards);

    if (dScore > 21 || pScore > dScore) {
      setMessage(`Vitória! ${aiResponse.message}`);
    } else if (dScore === pScore) {
      setMessage('Empate! Sorte na próxima.');
    } else {
      setMessage('Dealer ganhou. Tente novamente!');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-between h-full gap-8">
      {/* Dealer Side */}
      <div className="text-center space-y-4">
        <div className="flex gap-2 justify-center">
          {dealerCards.map((c, i) => (
            <div key={i} className="w-12 h-16 bg-white rounded border-2 border-gray-300 flex items-center justify-center text-black font-bold text-xl animate-in slide-in-from-top-10 shadow-lg">
              {c}
            </div>
          ))}
          {!gameOver && <div className="w-12 h-16 bg-blue-900 rounded border-2 border-white/20 shadow-lg"></div>}
        </div>
        <p className="text-sm font-rajdhani text-gray-400 uppercase tracking-widest">Dealer: {calculateScore(dealerCards)}</p>
      </div>

      {/* Status Message */}
      <div className="text-center">
        <h3 className={`text-xl font-bold font-rajdhani transition-all ${gameOver ? 'scale-125 text-yellow-400' : 'text-blue-400'}`}>
          {message}
        </h3>
        {aiThinking && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>}
      </div>

      {/* Player Side */}
      <div className="text-center space-y-6">
        <p className="text-sm font-rajdhani text-gray-400 uppercase tracking-widest">Sua Pontuação: {calculateScore(playerCards)}</p>
        <div className="flex gap-2 justify-center mb-8">
          {playerCards.map((c, i) => (
            <div key={i} className="w-16 h-24 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center text-black font-bold text-3xl animate-in slide-in-from-bottom-10 shadow-2xl">
              {c}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {!gameOver ? (
            <>
              <button 
                onClick={handleHit}
                className="bg-blue-600 px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-blue-500 active:scale-95 transition-all"
              >
                PEDIR (HIT)
              </button>
              <button 
                onClick={handleStand}
                className="bg-gray-800 px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-gray-700 active:scale-95 transition-all border border-white/10"
              >
                PARAR (STAND)
              </button>
            </>
          ) : (
            <button 
              onClick={resetGame}
              className="bg-yellow-600 px-12 py-3 rounded-2xl font-bold shadow-xl hover:bg-yellow-500 active:scale-95 transition-all"
            >
              JOGAR NOVAMENTE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;

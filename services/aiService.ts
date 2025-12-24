
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GameState {
  playerScore: number;
  dealerScore: number;
  history: string[];
}

export const getAIMove = async (gameType: string, state: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert ${gameType} player. Current state: ${JSON.stringify(state)}. Respond with a single word move and a short trash-talk sentence in Portuguese. Format: MOVE|MESSAGE`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const result = response.text || "HIT|Vamos ver o que você tem!";
    const [move, msg] = result.split('|');
    return { move: move.trim(), message: msg.trim() };
  } catch (error) {
    console.error("AI Error:", error);
    return { move: 'HIT', message: 'Meu turno!' };
  }
};

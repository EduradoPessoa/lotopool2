
import { GoogleGenAI, Type } from "@google/genai";
import { LOTTERY_CONFIGS, LotteryType } from "../types";

export const generateBudgetOptimizedTickets = async (
  type: LotteryType, 
  budget: number, 
  luckyNumbers: number[] = []
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = LOTTERY_CONFIGS[type];
  const priceTable = JSON.stringify(config.prices);
  
  const prompt = `Você é um especialista matemático em loterias.
  Loteria: ${config.name}.
  Orçamento: R$ ${budget.toFixed(2)}.
  Preços: ${priceTable}.
  NÚMEROS DA SORTE DOS PARTICIPANTES: ${luckyNumbers.join(', ')}.
  
  Sua tarefa: Gerar volantes otimizados. 
  CRÍTICO: Você DEVE incluir os números da sorte dos participantes em pelo menos 70% dos jogos gerados, pois eles acreditam que esses números trazem sorte.
  
  Retorne um JSON com:
  - tickets: [{numbers: [], cost: number}]
  - totalCostUsed: number
  - strategyExplanation: string (Explique como usou os números da sorte)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tickets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  numbers: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  cost: { type: Type.NUMBER }
                }
              }
            },
            totalCostUsed: { type: Type.NUMBER },
            strategyExplanation: { type: Type.STRING }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Budget optimization failed:", error);
    return null;
  }
};

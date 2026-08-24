import { GameReport } from "../types";

const getFallbackReport = (score: number, timeAlive: number): GameReport => {
  let rank = "Cadete Espacial";
  let message = "Tentativa corajosa, piloto. O núcleo sofreu danos críticos, mas os dados foram recuperados.";

  if (score >= 3000) {
    rank = "Almirante Supremo da Frota";
    message = `Desempenho lendário! Conseguiste ${score} pontos e aguentaste ${timeAlive.toFixed(1)}s sob fogo intenso. O núcleo esteve em mãos de mestre.`;
  } else if (score >= 1500) {
    rank = "Comandante de Elite";
    message = `Excelente reflexo operacional. ${score} pontos registados em ${timeAlive.toFixed(1)}s. As defesas aguentaram mais do que o previsto pelas simulações.`;
  } else if (score >= 700) {
    rank = "Tenente Estelar";
    message = `Bom esforço tático com ${score} pontos em ${timeAlive.toFixed(1)}s. Com mais alguns upgrades conseguirás defender o quadrante por completo.`;
  } else if (score >= 300) {
    rank = "Piloto de Reconhecimento";
    message = `O enxame de asteróides foi implacável. Registaste ${score} pontos em ${timeAlive.toFixed(1)}s. Reforça a blindagem na oficina e tenta novamente!`;
  } else {
    rank = "Recruta de Defesa";
    message = `Impacto fatal precoce após apenas ${timeAlive.toFixed(1)}s. Lembra-te de rodar o escudo na direção certa antes do choque!`;
  }

  return { rank, message };
};

export const generateBattleReport = async (score: number, timeAlive: number): Promise<GameReport> => {
  try {
    const apiKey = typeof process !== 'undefined' && process.env ? (process.env.API_KEY || process.env.GEMINI_API_KEY) : undefined;
    if (!apiKey) {
      return getFallbackReport(score, timeAlive);
    }

    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      O jogador acabou de terminar um jogo de "O Núcleo do Espaço" onde protege um núcleo de asteróides.
      Estatísticas:
      - Pontuação: ${score}
      - Tempo de Sobrevivência: ${timeAlive.toFixed(1)} segundos.

      Gera um relatório muito curto, estilo "Diário de Bordo" (Sci-Fi), em Português de Portugal (PT-PT), avaliando o desempenho.
      Se a pontuação for baixa (< 500), sê crítico/sarcástico mas divertido.
      Se a pontuação for alta (> 2000), mostra-te impressionado.

      Atribui também uma patente militar/sci-fi baseada no desempenho (em Português).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "A mensagem curta do diário do comandante" },
            rank: { type: Type.STRING, description: "A patente atribuída" }
          },
          required: ["message", "rank"]
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return getFallbackReport(score, timeAlive);

    return JSON.parse(jsonStr) as GameReport;

  } catch (error) {
    console.warn("AI Generation Error, falling back to local report:", error);
    return getFallbackReport(score, timeAlive);
  }
};

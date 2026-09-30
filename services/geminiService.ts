import { GameReport } from "../types";

export const generateBattleReport = async (score: number, timeAlive: number): Promise<GameReport> => {
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

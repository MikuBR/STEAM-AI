import { GoogleGenAI, Type } from "@google/genai";

export interface Recommendation {
  name: string;
  appId: number;
  reason: string;
  genres: string[];
  estimatedMatch: number;
  timeToBeat: number;
}

export interface GameData {
  name: string;
  playtime_forever: number;
}

async function generateWithFallback(
  activeAi: GoogleGenAI,
  prompt: string,
  schema: any,
  modelPrefs: string[]
): Promise<string> {
  for (const model of modelPrefs) {
    try {
      const response = await activeAi.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      return response.text;
    } catch (err: any) {
      if (err.status === 503 || err.message?.includes('503')) {
        continue;
      }
      throw err;
    }
  }
  return '{"recommendations":[]}';
}

export async function fetchRecommendations(
  apiKey: string,
  ownedGames: GameData[],
  recentGames: GameData[],
  preferences?: { moreOf?: string; lessOf?: string }
): Promise<Recommendation[]> {
  const ai = new GoogleGenAI({ apiKey });

  const prefsText = preferences
    ? `
    PREFERÊNCIAS DO USUÁRIO:
    - Quero mais jogos assim: ${preferences.moreOf || 'Não especificado'}
    - Não quero jogos assim: ${preferences.lessOf || 'Não especificado'}
    `
    : '';

  const prompt = `
    Você é um Barista Gamer muito carismático em uma cafeteria chamada "Steam Synapse". 
    Sua especialidade é analisar o "paladar" de jogos do cliente e servir (recomendar) 5 novos grãos (jogos) incríveis.

    Jogos Possuídos (e tempo de jogo em minutos):
    ${ownedGames.map((g: any) => `- ${g.name}: ${g.playtime_forever}min`).join('\n')}

    Jogos Jogados Recentemente:
    ${recentGames.map((g: any) => `- ${g.name}`).join('\n')}
    ${prefsText}

    Instruções:
    1. Recomende jogos que o usuário NÃO possui.
    2. Baseie as recomendações nos gêneros e estilos dos jogos com mais tempo de jogo E nas preferências fornecidas.
    3. No campo "reason", aja como o barista: faça paralelos entre café, aromas e o jogo.
    4. O campo "estimatedMatch" representa a porcentagem de "Sabor" que esse jogo tem em relação ao gosto do cliente.
    5. Retorne APENAS um JSON estruturado com os App IDs oficiais da Steam para cada jogo.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            appId: { type: Type.INTEGER, description: "Steam App ID for the game" },
            reason: { type: Type.STRING },
            genres: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedMatch: { type: Type.NUMBER, description: "0-100 percentage" },
            timeToBeat: { type: Type.NUMBER, description: "Estimated time to beat the main story in hours" },
          },
          required: ["name", "appId", "reason", "genres", "estimatedMatch", "timeToBeat"],
        },
      },
    },
    required: ["recommendations"],
  };

  const text = await generateWithFallback(ai, prompt, schema, ["gemini-3.5-flash", "gemini-3.1-pro-preview"]);

  try {
    const parsed = JSON.parse(text);
    const results = parsed.recommendations || [];

    for (const rec of results) {
      try {
        const searchRes = await fetch(
          `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(rec.name)}&l=english&cc=US`
        );
        const data = await searchRes.json();
        if (data?.items?.length > 0) {
          rec.appId = data.items[0].id;
          rec.name = data.items[0].name;
        }
      } catch {}
    }

    return results;
  } catch {
    return [];
  }
}

export async function fetchSimilarRecommendations(
  apiKey: string,
  gameName: string
): Promise<Recommendation[]> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    O usuário quer recomendações de jogos parecidos com "${gameName}".

    Instruções:
    1. Recomende 5 jogos que sejam muito semelhantes a "${gameName}" em termos de gênero, estilo de arte, ou mecânicas de gameplay.
    2. Explique por que cada jogo foi recomendado e o que ele tem em comum com "${gameName}".
    3. Retorne APENAS um JSON estruturado com os App IDs oficiais da Steam para cada jogo.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            appId: { type: Type.INTEGER, description: "Steam App ID for the game" },
            reason: { type: Type.STRING },
            genres: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedMatch: { type: Type.NUMBER, description: "0-100 percentage" },
            timeToBeat: { type: Type.NUMBER, description: "Estimated time to beat in hours" },
          },
          required: ["name", "appId", "reason", "genres", "estimatedMatch", "timeToBeat"],
        },
      },
    },
    required: ["recommendations"],
  };

  const text = await generateWithFallback(ai, prompt, schema, ["gemini-3.5-flash", "gemini-3.1-pro-preview"]);

  try {
    return JSON.parse(text).recommendations || [];
  } catch {
    return [];
  }
}

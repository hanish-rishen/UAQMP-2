import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export async function getAirQualityInsights(
  city: string,
  pollutants: Array<{ id: string; value: string }>
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `
    Analyze the air quality data for ${city}:
    ${pollutants.map((p) => `${p.id}: ${p.value}`).join("\n")}

    Respond in this exact format without any special characters or markdown:

    AIR QUALITY ASSESSMENT:
    (provide a single sentence assessment of overall air quality)

    HEALTH RECOMMENDATIONS:
    - (first recommendation)
    - (second recommendation if needed)
    - (third recommendation if needed)

    WEATHER IMPACT ANALYSIS:
    - (describe how current pollution levels might be affected by weather)
    - (mention likely atmospheric conditions based on pollution patterns)

    Important: Do not use asterisks or special formatting. Use plain text only.
    For the Weather Impact Analysis, focus on how weather conditions might be affecting pollution levels.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().replace(/\*+/g, "").trim();
  } catch (error) {
    console.error("Error getting AI insights:", error);
    return "Unable to generate insights at the moment.";
  }
}

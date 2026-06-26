import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function roastResume(resumeText) {
  if (!apiKey || apiKey.includes('your_') || apiKey.includes('here')) {
    throw new Error('API key is not configured. Please add it to your .env file.');
  }

  if (!genAI) {
    throw new Error('Gemini API client could not be initialized.');
  }

  const systemPrompt = `You are a witty, brutally honest resume reviewer. Read this resume and provide a short roast that is funny but also genuinely useful. Use plenty of emojis to make the roast more expressive and entertaining. End with three concrete suggestions. Use markdown formatting to make the roast engaging and readable.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.2 },
  });

  const result = await model.generateContent(`Here is the resume content:\n\n${resumeText}`);
  const response = await result.response;
  return response.text();
}

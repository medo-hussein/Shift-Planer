
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

// التحقق من وجود المفتاح
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env file");
}

// تهيئة العميل الجديد
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateReportSummary = async (reportData, reportType, language = 'ar') => {
  try {
    const dataString = JSON.stringify(reportData).substring(0, 20000);

    let prompt = "";

    if (language === 'ar') {
        // البرومبت العربي (الموجود حالياً)
        prompt = `
          أنت محلل بيانات موارد بشرية خبير. قم بتحليل البيانات التالية للكشف عن رؤى عميقة.
          
          **نوع التقرير:** ${reportType}
          **البيانات:** ${dataString}
          
          **التعليمات:**
          1. حلل الاتجاهات (الغياب، التأخير، الأداء).
          2. اذكر أسماء الموظفين المتميزين والمحتاجين للدعم (استخدم حقل "name").
          3. قدم 3 توصيات عملية.
          4. التنسيق: عناوين واضحة ونقاط.
          5. **اللغة: العربية الفصحى المهنية.**
        `;
    } else {
        // البرومبت الإنجليزي
        prompt = `
          You are an expert HR Data Analyst. Analyze the following workforce data to uncover deep insights.
          
          **Report Type:** ${reportType}
          **Data:** ${dataString}
          
          **Instructions:**
          1. Analyze trends (absenteeism, lateness, performance).
          2. Highlight top performers and those needing support (use "name" field).
          3. Provide 3 actionable recommendations.
          4. Format: Clear headings and bullet points.
          5. **Language: Professional English.**
        `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("❌ AI Service Error:", error.message);
    
    if (error.message.includes("404") || error.message.includes("not found")) {
        console.error("👉 تنبيه: تأكد من أن الموديل متاح لحسابك.");
    }
    
    throw new Error("Failed to generate AI summary using Gemini.");
  }
};
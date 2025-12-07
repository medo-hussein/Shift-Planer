import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env file");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateReportSummary = async (reportData, reportType, language = 'ar') => {
  try {
    const dataString = JSON.stringify(reportData).substring(0, 20000);

    let prompt = "";

    if (language === 'ar') {
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

export const parseShiftCommand = async (command, employees, contextDate = new Date(), timeZone = "UTC") => {
  try {
    const employeeList = employees.map(e => ({ id: e._id, name: e.name }));
    
    const prompt = `
      You are an expert AI Scheduler.
      
      **Context:**
      - **Target Timezone:** ${timeZone} (CRITICAL: All requested times are in this timezone).
      - **Reference Date:** ${contextDate.toISOString()} (This is UTC).
      - **Employees:** ${JSON.stringify(employeeList)}
      
      **Task:**
      Parse the following command into a JSON array of shifts.
      
      **Command:** "${command}"
      
      **CRITICAL TIME INSTRUCTIONS:**
      1. The user means times in **${timeZone}**.
      2. You MUST convert these local times to **UTC ISO 8601 strings**.
      3. Example: If user says "9 AM" and timezone is "Africa/Cairo" (UTC+2), you must output "T07:00:00Z".
      4. Do NOT simply append the hour to the date. Calculate the offset correctly.
      
      **Output Requirements:**
      - Return ONLY a valid JSON array. No markdown, no explanations.
      - Each object must have:
        - "employee_id": (The matching ID from the list)
        - "start_date_time": (UTC ISO String)
        - "end_date_time": (UTC ISO String)
        - "title": (e.g., "Morning Shift", "Night Shift" - infer from time)
        - "shift_type": (One of: "regular", "overtime", "weekend", "holiday")
        - "notes": (Any extra details mentioned)
      
      If an employee name is fuzzy matched, select the closest one.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = typeof response.text === 'function' ? response.text() : response.text;
    const jsonStr = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("AI Schedule Error:", error);
    throw new Error("Failed to parse schedule command.");
  }
};
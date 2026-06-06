import { ContentEntry, PlatformProfiles } from '../types';

export interface GeminiAnomaly {
  title: string;
  day: number;
  platform: 'instagram' | 'tiktok' | 'both';
  type: 'positive_outlier' | 'interaction_mismatch' | 'day_pattern' | 'other';
  description: string;
}

export interface GeminiTypology {
  patternName: string;
  description: string;
  associatedKeywords: string[];
  performanceLevel: 'high' | 'medium' | 'low';
  averageViews: number;
}

export interface GeminiPlatformComparison {
  platformPreference: string;
  instagramStrengths: string;
  tiktokStrengths: string;
  recommendation: string;
}

export interface GeminiReportResponse {
  executiveSummary: string;
  anomalies: GeminiAnomaly[];
  contentTypology: GeminiTypology[];
  platformComparison: GeminiPlatformComparison;
  actionRecommendations: string[];
}

/**
 * Menyederhanakan nama model API yang panjang menjadi lebih ringkas untuk tampilan UI.
 */
export const simplifyModelName = (model: string): string => {
  if (!model) return 'Belum diatur';
  
  // Hapus path provider (seperti meta-llama/, deepseek-ai/, dll)
  let cleanName = model.split('/').pop() || model;
  
  // Pemetaan manual untuk model populer agar lebih cantik
  const mapping: Record<string, string> = {
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.0-flash-thinking-exp': 'Gemini 2.0 Thinking',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'Qwen2.5-72B-Instruct': 'Qwen 2.5 72B',
    'DeepSeek-R1-Distill-Qwen-32B': 'DeepSeek R1 32B',
    'Llama-3.3-70B-Instruct': 'Llama 3.3 70B',
    'Mistral-7B-Instruct-v0.3': 'Mistral 7B',
    'Phi-3-mini-4k-instruct': 'Phi-3 Mini'
  };
  
  if (mapping[cleanName]) {
    return mapping[cleanName];
  }
  
  // Fallback: hapus strip/dash dan buat judul lebih rapi
  return cleanName
    .replace(/-instruct/gi, '')
    .replace(/-distill/gi, '')
    .replace(/-exp/gi, '')
    .replace(/-/g, ' ');
};

/**
 * Sends metrics data to Google AI Studio Gemini API and returns a structured analysis.
 */
export const generateGeminiReport = async (
  apiKey: string,
  model: string,
  periodType: 'month' | 'year',
  periodLabel: string,
  profiles: PlatformProfiles,
  entries: ContentEntry[],
  customInstructions?: string
): Promise<GeminiReportResponse> => {
  if (!apiKey) {
    throw new Error('API Key Google AI Studio belum diatur. Silakan masuk ke Setelan di sidebar.');
  }

  // Sanitize data to keep it small but informative
  const sanitizedEntries = entries.map(e => ({
    day: e.day,
    title: e.title,
    instagram: {
      views: e.instagram.views,
      likes: e.instagram.likes,
      comments: e.instagram.comments,
      saves: e.instagram.saves,
      shares: e.instagram.shares,
    },
    tiktok: {
      views: e.tiktok.views,
      likes: e.tiktok.likes,
      comments: e.tiktok.comments,
      saves: e.tiktok.saves,
      shares: e.tiktok.shares,
    }
  }));

  const profilesData = {
    instagram: {
      username: profiles.instagram.username,
      followers: profiles.instagram.followers
    },
    tiktok: {
      username: profiles.tiktok.username,
      followers: profiles.tiktok.followers
    }
  };

  const systemInstructions = `
Anda adalah Antigravity AI, seorang analis media sosial senior dan ahli strategi pertumbuhan digital.
Tugas Anda adalah menganalisis data performa konten media sosial untuk membuat laporan terperinci dalam format JSON.
Analisis Anda harus sangat mendalam, tajam, dan realistis, mencakup deteksi anomali dan analisis tipologi konten.

Anda harus mengembalikan respons dalam format JSON yang valid dengan skema berikut:
{
  "executiveSummary": "Analisis singkat (2-3 kalimat) mengenai kinerja keseluruhan akun selama periode ini.",
  "anomalies": [
    {
      "title": "Judul konten yang mengalami anomali",
      "day": tanggal hari postingan (angka),
      "platform": "instagram" | "tiktok" | "both",
      "type": "positive_outlier" (views meledak di atas rata-rata) | "interaction_mismatch" (views tinggi tapi interaksi rendah, atau sebaliknya) | "day_pattern" (anomali hari postingan) | "other",
      "description": "Penjelasan mengapa ini dikategorikan sebagai anomali dan hipotesis penyebabnya secara logis."
    }
  ],
  "contentTypology": [
    {
      "patternName": "Nama tipologi/pola konten (misal: 'Vlog Estetik', 'Room Tour', 'ASMR Coffee')",
      "description": "Mengapa tipologi ini memiliki performa tertentu dan bagaimana pengaruhnya terhadap audiens.",
      "associatedKeywords": ["kata", "kunci", "dari", "judul", "konten"],
      "performanceLevel": "high" | "medium" | "low",
      "averageViews": rata-rata views untuk jenis konten ini (angka)
    }
  ],
  "platformComparison": {
    "platformPreference": "Platform mana yang bekerja lebih baik untuk audiens saat ini dan mengapa.",
    "instagramStrengths": "Kekuatan utama konten di Instagram selama periode ini.",
    "tiktokStrengths": "Kekuatan utama konten di TikTok selama periode ini.",
    "recommendation": "Rekomendasi taktis spesifik untuk menyeimbangkan atau mengoptimalkan kedua platform."
  },
  "actionRecommendations": [
    "Rekomendasi taktis 1 (harus spesifik, terukur, dan praktis)",
    "Rekomendasi taktis 2",
    "Rekomendasi taktis 3"
  ]
}

Aturan Analisis Tambahan:
1. Cari pola kata kunci dari judul konten untuk mengidentifikasi tipologi konten (contentTypology). Kelompokkan judul yang mirip.
2. Identifikasi anomali (anomalies) seperti konten yang memiliki views > 20.000 (FYP) dibanding rata-rata konten lain, atau konten yang sangat sedikit views tapi disukai banyak orang.
3. Tulis teks penjelasan dalam Bahasa Indonesia yang profesional, ringkas, dan menginspirasi kreator.
  `;

  const prompt = `
Berikut adalah data profil dan entri konten untuk periode: ${periodLabel} (Tipe Laporan: ${periodType === 'month' ? 'Bulanan' : 'Tahunan'}).

DATA PROFIL:
${JSON.stringify(profilesData, null, 2)}

DATA ENTRI KONTEN (${sanitizedEntries.length} entri ditemukan):
${JSON.stringify(sanitizedEntries, null, 2)}

Lakukan analisis mendalam sesuai instruksi sistem dan berikan respons JSON.
  `;

  let finalSystemInstructions = systemInstructions;
  if (customInstructions && customInstructions.trim()) {
    finalSystemInstructions += `\n\nInstruksi Khusus Tambahan dari Pengguna (PENTING: Harus diikuti secara ketat dalam analisis Anda):\n${customInstructions.trim()}`;
  }

  // Endpoint API Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: finalSystemInstructions
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMessage = `HTTP error ${response.status}`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        errMessage = errJson.error.message;
      }
    } catch {
      // ignore parsing error
    }
    throw new Error(`Gagal menghubungi Gemini API: ${errMessage}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Format respons Gemini API tidak valid (tidak ada konten teks).');
  }

  try {
    return parseJsonResponse(text);
  } catch (err) {
    console.error('Raw Gemini Response failed to parse as JSON:', text);
    throw new Error('Gagal mengurai hasil analisis AI sebagai JSON. Respons AI tidak mengikuti format yang diminta.');
  }
};

/**
 * Robustly parses a JSON string, stripping markdown codeblocks and extracting first '{' and last '}' matches.
 */
export const parseJsonResponse = (text: string): any => {
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }
  
  // Find first '{' and last '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  return JSON.parse(cleaned);
};

/**
 * Sends social media metrics to Hugging Face Serverless Inference API (OpenAI-compatible) for report generation.
 */
export const generateHuggingFaceReport = async (
  apiKey: string,
  model: string,
  periodType: 'month' | 'year',
  periodLabel: string,
  profiles: PlatformProfiles,
  entries: ContentEntry[],
  customInstructions?: string
): Promise<GeminiReportResponse> => {
  if (!apiKey) {
    throw new Error('API Key Hugging Face belum diatur. Silakan tambahkan API Key di setelan.');
  }

  const sanitizedEntries = entries.map(e => ({
    day: e.day,
    title: e.title,
    instagram: {
      views: e.instagram.views,
      likes: e.instagram.likes,
      comments: e.instagram.comments,
      saves: e.instagram.saves,
      shares: e.instagram.shares,
    },
    tiktok: {
      views: e.tiktok.views,
      likes: e.tiktok.likes,
      comments: e.tiktok.comments,
      saves: e.tiktok.saves,
      shares: e.tiktok.shares,
    }
  }));

  const profilesData = {
    instagram: {
      username: profiles.instagram.username,
      followers: profiles.instagram.followers
    },
    tiktok: {
      username: profiles.tiktok.username,
      followers: profiles.tiktok.followers
    }
  };

  const systemInstructions = `
Anda adalah Antigravity AI, seorang analis media sosial senior dan ahli strategi pertumbuhan digital.
Tugas Anda adalah menganalisis data performa konten media sosial untuk membuat laporan terperinci dalam format JSON.
Analisis Anda harus sangat mendalam, tajam, dan realistis, mencakup deteksi anomali dan analisis tipologi konten.

Anda HARUS mengembalikan respons dalam format JSON yang valid dengan skema berikut:
{
  "executiveSummary": "Analisis singkat (2-3 kalimat) mengenai kinerja keseluruhan akun selama periode ini.",
  "anomalies": [
    {
      "title": "Judul konten",
      "day": 10,
      "platform": "instagram" | "tiktok" | "both",
      "type": "positive_outlier" | "interaction_mismatch" | "day_pattern" | "other",
      "description": "Penjelasan mengapa ini dikategorikan sebagai anomali secara logis."
    }
  ],
  "contentTypology": [
    {
      "patternName": "Nama tipologi/pola konten (misal: 'ASMR Coffee')",
      "description": "Mengapa tipologi ini memiliki performa tertentu.",
      "associatedKeywords": ["kata", "kunci"],
      "performanceLevel": "high" | "medium" | "low",
      "averageViews": 45000
    }
  ],
  "platformComparison": {
    "platformPreference": "Platform mana yang bekerja lebih baik dan mengapa.",
    "instagramStrengths": "Kekuatan utama di Instagram.",
    "tiktokStrengths": "Kekuatan utama di TikTok.",
    "recommendation": "Rekomendasi taktis spesifik untuk menyeimbangkan/mengoptimalkan kedua platform."
  },
  "actionRecommendations": [
    "Rekomendasi taktis 1 (spesifik dan praktis)",
    "Rekomendasi taktis 2",
    "Rekomendasi taktis 3"
  ]
}

Aturan tambahan:
1. Cari pola kata kunci dari judul konten untuk mengidentifikasi tipologi konten.
2. Identifikasi anomali.
3. Tulis teks penjelasan dalam Bahasa Indonesia yang profesional dan ringkas.
Kembalikan HANYA teks JSON tersebut, tanpa formatting markdown lain jika memungkinkan.
  `;

  const prompt = `
Berikut adalah data profil dan entri konten untuk periode: ${periodLabel} (Tipe Laporan: ${periodType === 'month' ? 'Bulanan' : 'Tahunan'}).

DATA PROFIL:
${JSON.stringify(profilesData, null, 2)}

DATA ENTRI KONTEN (${sanitizedEntries.length} entri ditemukan):
${JSON.stringify(sanitizedEntries, null, 2)}

Lakukan analisis mendalam sesuai instruksi sistem dan berikan respons JSON.
  `;

  let finalSystemInstructions = systemInstructions;
  if (customInstructions && customInstructions.trim()) {
    finalSystemInstructions += `\n\nInstruksi Khusus Tambahan dari Pengguna (PENTING: Harus diikuti secara ketat dalam analisis Anda):\n${customInstructions.trim()}`;
  }

  const url = `https://router.huggingface.co/v1/chat/completions`;

  const makeRequest = async (useJsonFormat: boolean) => {
    const body: any = {
      model,
      messages: [
        { role: 'system', content: finalSystemInstructions },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.2
    };

    if (useJsonFormat) {
      body.response_format = { type: 'json_object' };
    }

    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
  };

  let response = await makeRequest(true);

  if (!response.ok) {
    const errText = await response.text();
    const errLower = errText.toLowerCase();
    
    if (
      errLower.includes('response_format') ||
      errLower.includes('response format') ||
      errLower.includes('json')
    ) {
      console.warn("Hugging Face model failed with response_format option. Retrying without it...");
      response = await makeRequest(false);
      
      if (!response.ok) {
        const retryErrText = await response.text();
        let errMessage = `HTTP error ${response.status}`;
        try {
          const errJson = JSON.parse(retryErrText);
          if (errJson.error) {
            errMessage = typeof errJson.error === 'string' 
              ? errJson.error 
              : errJson.error.message || JSON.stringify(errJson.error);
          } else if (errJson.message) {
            errMessage = errJson.message;
          }
        } catch {}
        throw new Error(`Gagal menghubungi Hugging Face API: ${errMessage}`);
      }
    } else {
      let errMessage = `HTTP error ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) {
          errMessage = typeof errJson.error === 'string' 
            ? errJson.error 
            : errJson.error.message || JSON.stringify(errJson.error);
        } else if (errJson.message) {
          errMessage = errJson.message;
        }
      } catch {}
      throw new Error(`Gagal menghubungi Hugging Face API: ${errMessage}`);
    }
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Format respons Hugging Face API tidak valid (tidak ada konten teks).');
  }

  try {
    return parseJsonResponse(text);
  } catch (err) {
    console.error('Raw Hugging Face Response failed to parse as JSON:', text);
    throw new Error('Gagal mengurai hasil analisis AI Hugging Face sebagai JSON. Respons AI tidak mengikuti format yang diminta.');
  }
};

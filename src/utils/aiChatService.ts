import { PlatformProfiles, FolderDataState } from '../types';
import { MONTH_NAMES } from './initialState';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Merangkum data analitik dan profil kreator menjadi ringkasan teks terstruktur (JSON minimal)
 * agar efisien dan tidak memakan terlalu banyak token API.
 */
export const prepareChatContext = (
  profiles: PlatformProfiles,
  folders: FolderDataState,
  selectedYear: number,
  selectedMonth: number
): string => {
  const currentMonthEntries = folders[selectedYear]?.[selectedMonth] || [];
  const totalEntries = currentMonthEntries.length;
  
  let igTotalViews = 0;
  let igTotalLikes = 0;
  let igTotalComments = 0;
  let igTotalSaves = 0;
  let igTotalShares = 0;
  
  let ttTotalViews = 0;
  let ttTotalLikes = 0;
  let ttTotalComments = 0;
  let ttTotalSaves = 0;
  let ttTotalShares = 0;
  
  const topContents: { title: string; views: number; platform: string; likes: number }[] = [];
  
  currentMonthEntries.forEach(entry => {
    igTotalViews += entry.instagram.views;
    igTotalLikes += entry.instagram.likes;
    igTotalComments += entry.instagram.comments;
    igTotalSaves += entry.instagram.saves;
    igTotalShares += entry.instagram.shares;
    
    ttTotalViews += entry.tiktok.views;
    ttTotalLikes += entry.tiktok.likes;
    ttTotalComments += entry.tiktok.comments;
    ttTotalSaves += entry.tiktok.saves;
    ttTotalShares += entry.tiktok.shares;
    
    const maxViews = Math.max(entry.instagram.views, entry.tiktok.views);
    const platform = entry.instagram.views > entry.tiktok.views ? 'Instagram' : 'TikTok';
    topContents.push({ 
      title: entry.title, 
      views: maxViews, 
      likes: entry.instagram.views > entry.tiktok.views ? entry.instagram.likes : entry.tiktok.likes,
      platform 
    });
  });
  
  // Ambil top 3 postingan berdasarkan views
  topContents.sort((a, b) => b.views - a.views);
  const top3 = topContents.slice(0, 3);
  
  const context = {
    selectedPeriod: `${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
    profiles: {
      instagram: {
        username: profiles.instagram.username,
        followers: profiles.instagram.followers
      },
      tiktok: {
        username: profiles.tiktok.username,
        followers: profiles.tiktok.followers
      }
    },
    metricsSummary: {
      totalPosts: totalEntries,
      instagram: {
        totalViews: igTotalViews,
        totalLikes: igTotalLikes,
        totalComments: igTotalComments,
        totalSaves: igTotalSaves,
        totalShares: igTotalShares,
        averageViews: totalEntries > 0 ? Math.round(igTotalViews / totalEntries) : 0
      },
      tiktok: {
        totalViews: ttTotalViews,
        totalLikes: ttTotalLikes,
        totalComments: ttTotalComments,
        totalSaves: ttTotalSaves,
        totalShares: ttTotalShares,
        averageViews: totalEntries > 0 ? Math.round(ttTotalViews / totalEntries) : 0
      }
    },
    topPerformingPosts: top3
  };
  
  return JSON.stringify(context, null, 2);
};

/**
 * Mengirim riwayat obrolan dan data konteks analitik ke API yang dipilih (Gemini atau Hugging Face).
 */
export const sendAiChatMessage = async (
  apiKey: string,
  model: string,
  provider: 'gemini' | 'huggingface',
  chatHistory: ChatMessage[],
  contextData: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API Key belum diatur. Harap tambahkan API Key terlebih dahulu di Setelan Sidebar.');
  }

  const systemInstructions = `Anda adalah Antigravity AI, asisten pertumbuhan media sosial senior dan ahli strategi konten digital.
Tugas Anda adalah membantu kreator memahami data performa mereka, menyarankan taktik konkret, memberikan ide hook konten baru, caption, hashtag, dan membantu memecahkan tantangan pertumbuhan.

Gaya Bahasa: Santai, ramah, kekinian, penuh semangat, dan menginspirasi (seperti mentor media sosial Indonesia). Gunakan kata-kata penarik perhatian sosmed Indonesia (misal: FYP, rame, sepi, konten pecah, dsb).
Format Output: Tuliskan respons menggunakan Markdown yang rapi (bold, list, bullet points, emoji yang sesuai) agar sangat mudah dibaca di panel chat.

Berikut adalah data analitik dan profil kreator aktif saat ini sebagai referensi utama Anda:
${contextData}

PENTING: Selalu hubungkan saran Anda dengan angka performa di atas apabila relevan. Jangan mengarang data di luar data yang diberikan.`;

  if (provider === 'gemini') {
    // Format pesan untuk Gemini API
    const contents = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstructions }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200
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
      } catch {}
      throw new Error(`Gagal menghubungi Gemini API: ${errMessage}`);
    }

    const json = await response.json();
    const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!replyText) {
      throw new Error('Format respons Gemini API tidak valid (tidak ada konten teks).');
    }

    return replyText;
  } else {
    // Format pesan untuk Hugging Face Router
    const messages = [
      { role: 'system', content: systemInstructions },
      ...chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    const url = `https://router.huggingface.co/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMessage = `HTTP error ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) {
          errMessage = typeof errJson.error === 'string' 
            ? errJson.error 
            : errJson.error.message || JSON.stringify(errJson.error);
        }
      } catch {}
      throw new Error(`Gagal menghubungi Hugging Face API: ${errMessage}`);
    }

    const json = await response.json();
    const replyText = json.choices?.[0]?.message?.content;
    if (!replyText) {
      throw new Error('Format respons Hugging Face API tidak valid (tidak ada konten teks).');
    }

    return replyText;
  }
};

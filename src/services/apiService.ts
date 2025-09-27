import OpenAI from 'openai';
import axios from 'axios';

let openaiClient: OpenAI | null = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인하세요.');
    }

    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  return openaiClient;
};

// Tavily Search API 인터페이스
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// 재시도 함수
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

// 웹 검색 함수
export const searchWeb = async (query: string): Promise<TavilySearchResult[]> => {
  return retryWithBackoff(async () => {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.REACT_APP_TAVILY_API_KEY,
      query: query,
      search_depth: 'basic',
      include_answer: false,
      include_images: false,
      include_raw_content: false,
      max_results: 5,
      include_domains: [],
      exclude_domains: []
    }, {
      timeout: 10000 // 10초 타임아웃
    });

    return response.data.results || [];
  }, 2, 1000);
};

// OpenAI GPT 호출 함수
export const generateAIResponse = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  useSearch: boolean = false
): Promise<string> => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  if (backendUrl) {
    const response = await retryWithBackoff(async () => {
      const { data } = await axios.post(
        `${backendUrl.replace(/\/$/, '')}/chat`,
        { messages, useSearch },
        { timeout: 20000 }
      );

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.reply || data?.response || data?.message || '';
    }, 3, 1500);

    if (!response) {
      throw new Error('백엔드에서 유효한 응답을 받지 못했습니다.');
    }

    return response;
  }

  return retryWithBackoff(async () => {
    let systemPrompt = `당신은 도움이 되고 지식이 풍부한 AI 어시스턴트입니다. 
사용자의 질문에 정확하고 유용한 답변을 제공하세요. 
답변은 한국어로 작성하고, 구체적이고 실용적인 정보를 포함해주세요.
현재 날짜는 2025년 9월 23일입니다.`;

    // 검색이 필요한 경우 최신 정보 검색
    if (useSearch) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        try {
          const searchResults = await searchWeb(lastUserMessage.content);

          if (searchResults.length > 0) {
            const searchContext = searchResults
              .slice(0, 3)
              .map(result => `제목: ${result.title}\n내용: ${result.content}\n출처: ${result.url}`)
              .join('\n\n');

            systemPrompt += `\n\n다음은 검색을 통해 얻은 최신 정보입니다:\n${searchContext}\n\n이 정보를 참고하여 답변해주세요.`;
          }
        } catch (searchError) {
          console.warn('Search failed, continuing without search results:', searchError);
        }
      }
    }

    // 환경변수에서 모델명 가져오기 (기본값: gpt-3.5-turbo)
    const modelName = process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo';

    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';
  }, 3, 2000);
};

// OpenAI GPT 스트리밍 호출 함수
export const generateAIResponseStream = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  useSearch: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  if (process.env.REACT_APP_BACKEND_URL) {
    throw new Error('백엔드 연동 모드에서는 스트리밍 응답이 아직 지원되지 않습니다.');
  }

  return retryWithBackoff(async () => {
    let systemPrompt = `당신은 도움이 되고 지식이 풍부한 AI 어시스턴트입니다. 
사용자의 질문에 정확하고 유용한 답변을 제공하세요. 
답변은 한국어로 작성하고, 구체적이고 실용적인 정보를 포함해주세요.
현재 날짜는 2025년 9월 23일입니다.`;

    // 검색이 필요한 경우 최신 정보 검색
    if (useSearch) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        try {
          const searchResults = await searchWeb(lastUserMessage.content);

          if (searchResults.length > 0) {
            const searchContext = searchResults
              .slice(0, 3)
              .map(result => `제목: ${result.title}\n내용: ${result.content}\n출처: ${result.url}`)
              .join('\n\n');

            systemPrompt += `\n\n다음은 검색을 통해 얻은 최신 정보입니다:\n${searchContext}\n\n이 정보를 참고하여 답변해주세요.`;
          }
        } catch (searchError) {
          console.warn('Search failed, continuing without search results:', searchError);
        }
      }
    }

    const modelName = process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo';

    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    });

    let fullResponse = '';

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }

    return fullResponse || '죄송합니다. 응답을 생성할 수 없습니다.';
  }, 3, 2000);
};

// 검색이 필요한지 판단하는 함수
export const shouldUseSearch = (message: string): boolean => {
  const searchKeywords = [
    '최신', '뉴스', '현재', '오늘', '2025', '2024',
    '주가', '날씨', '트렌드', '최근', '업데이트',
    '실시간', '지금', '현재상황', '시장', '정보',
    '찾아', '검색', '알려'
  ];

  return searchKeywords.some(keyword => message.includes(keyword));
};

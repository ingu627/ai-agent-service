import OpenAI from 'openai';
import axios from 'axios';

let openaiClient: OpenAI | null = null;

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type AIProvider = 'openai' | 'perplexity';

const PERPLEXITY_API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_DEFAULT_MODEL = 'llama-3.1-sonar-small-128k-online';
const THINK_OPEN_TAG = '<think>';
const THINK_CLOSE_TAG = '</think>';

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

const resolveAIProvider = (): AIProvider => {
  const configured = process.env.REACT_APP_AI_PROVIDER?.toLowerCase();

  if (configured === 'perplexity' || configured === 'openai') {
    return configured;
  }

  if (process.env.REACT_APP_PERPLEXITY_API_KEY && !process.env.REACT_APP_OPENAI_API_KEY) {
    return 'perplexity';
  }

  return 'openai';
};

export const getActiveAIProvider = (): AIProvider => resolveAIProvider();

const getPerplexityConfig = () => {
  const apiKey = process.env.REACT_APP_PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('Perplexity API 키가 설정되지 않았습니다. 환경변수를 확인하세요.');
  }

  const model =
    process.env.REACT_APP_PERPLEXITY_MODEL ||
    process.env.REACT_APP_LLM_MODEL ||
    PERPLEXITY_DEFAULT_MODEL;

  return { apiKey, model };
};

const createThinkingFilter = () => {
  let inThinkingSection = false;
  let carry = '';

  const processText = (chunk: string, isFinal: boolean): string => {
    let text = carry + chunk;
    carry = '';
    let output = '';
    let index = 0;

    while (index < text.length) {
      if (inThinkingSection) {
        const closeIndex = text.indexOf(THINK_CLOSE_TAG, index);

        if (closeIndex === -1) {
          if (!isFinal) {
            const sliceStart = Math.max(index - (THINK_CLOSE_TAG.length - 1), 0);
            carry = text.slice(sliceStart);
            return output;
          }

          return output;
        }

        index = closeIndex + THINK_CLOSE_TAG.length;
        inThinkingSection = false;
        continue;
      }

      const openIndex = text.indexOf(THINK_OPEN_TAG, index);

      if (openIndex === -1) {
        if (!isFinal && text.length - index < THINK_OPEN_TAG.length - 1) {
          carry = text.slice(index);
          return output;
        }

        output += text.slice(index);
        index = text.length;
        break;
      }

      if (openIndex > index) {
        output += text.slice(index, openIndex);
      }

      index = openIndex + THINK_OPEN_TAG.length;
      inThinkingSection = true;
    }

    if (isFinal && carry) {
      output += carry;
      carry = '';
    }

    return output;
  };

  return {
    push: (chunk: string) => processText(chunk, false),
    finish: () => processText('', true)
  };
};

const stripReasoningTags = (text: string): string => {
  const filter = createThinkingFilter();
  const cleaned = filter.push(text) + filter.finish();
  return cleaned.trim();
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
      timeout: 100000 // 10초 타임아웃
    });

    return response.data.results || [];
  }, 2, 1000);
};

const buildSystemPrompt = async (messages: ChatMessage[], useSearch: boolean): Promise<string> => {
  let systemPrompt = `당신은 도움이 되고 지식이 풍부한 AI 어시스턴트입니다. 
사용자의 질문에 정확하고 유용한 답변을 제공하세요. 
답변은 한국어로 작성하고, 구체적이고 실용적인 정보를 포함해주세요.
현재 날짜는 2025년 9월 23일입니다.`;

  if (useSearch) {
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user');

    if (lastUserMessage) {
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

  return systemPrompt;
};

const buildMessagesWithSystemPrompt = async (messages: ChatMessage[], useSearch: boolean): Promise<ChatMessage[]> => {
  const systemPrompt = await buildSystemPrompt(messages, useSearch);

  return [
    { role: 'system', content: systemPrompt },
    ...messages
  ];
};

const callPerplexityChatCompletion = async (messages: ChatMessage[]): Promise<string> => {
  const { apiKey, model } = getPerplexityConfig();

  const { data } = await axios.post(
    PERPLEXITY_API_ENDPOINT,
    {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 5000
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 100000
    }
  );

  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    return '죄송합니다. 응답을 생성할 수 없습니다.';
  }

  const cleaned = stripReasoningTags(rawContent);
  return cleaned || '죄송합니다. 응답을 생성할 수 없습니다.';
};

const callPerplexityStreamCompletion = async (
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const { apiKey, model } = getPerplexityConfig();

  const response = await fetch(PERPLEXITY_API_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 5000,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API 오류: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Perplexity 응답 스트림을 읽을 수 없습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let cleanedResponse = '';
  const thinkFilter = createThinkingFilter();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';

    for (const event of events) {
      const lines = event.split(/\r?\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) {
          continue;
        }

        const dataStr = line.slice(5).trim();

        if (!dataStr) {
          continue;
        }

        if (dataStr === '[DONE]') {
          const tail = thinkFilter.finish();
          if (tail) {
            cleanedResponse += tail;
            onChunk?.(tail);
          }

          await reader.cancel();
          return cleanedResponse.trim() || '죄송합니다. 응답을 생성할 수 없습니다.';
        }

        try {
          const payload = JSON.parse(dataStr);
          const delta =
            payload?.choices?.[0]?.delta?.content ??
            payload?.choices?.[0]?.message?.content ??
            '';

          if (delta) {
            const filteredChunk = thinkFilter.push(delta);
            if (filteredChunk) {
              cleanedResponse += filteredChunk;
              onChunk?.(filteredChunk);
            }
          }
        } catch (error) {
          console.warn('Perplexity stream chunk parse failed:', error, dataStr);
        }
      }
    }
  }

  const remaining = thinkFilter.finish();
  if (remaining) {
    cleanedResponse += remaining;
    onChunk?.(remaining);
  }

  if (!cleanedResponse) {
    throw new Error('AI 응답을 생성하지 못했습니다.');
  }

  return cleanedResponse.trim();
};

const callOpenAIChatCompletion = async (messages: ChatMessage[], modelName: string): Promise<string> => {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages,
    temperature: 0.7,
    max_tokens: 5000,
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    return '죄송합니다. 응답을 생성할 수 없습니다.';
  }

  const cleaned = stripReasoningTags(rawContent);
  return cleaned || '죄송합니다. 응답을 생성할 수 없습니다.';
};

const callOpenAIStreamCompletion = async (
  messages: ChatMessage[],
  modelName: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages,
    temperature: 0.7,
    max_tokens: 5000,
    stream: true
  });

  let cleanedResponse = '';
  const thinkFilter = createThinkingFilter();

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      const filteredChunk = thinkFilter.push(content);
      if (filteredChunk) {
        cleanedResponse += filteredChunk;
        onChunk?.(filteredChunk);
      }
    }
  }

  const remaining = thinkFilter.finish();
  if (remaining) {
    cleanedResponse += remaining;
    onChunk?.(remaining);
  }

  if (!cleanedResponse) {
    throw new Error('AI 응답을 생성하지 못했습니다.');
  }

  return cleanedResponse.trim();
};

// AI 응답 생성
export const generateAIResponse = async (
  messages: ChatMessage[],
  useSearch: boolean = false
): Promise<string> => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  if (backendUrl) {
    const response = await retryWithBackoff(async () => {
      const { data } = await axios.post(
        `${backendUrl.replace(/\/$/, '')}/chat`,
        { messages, useSearch },
        { timeout: 100000 }
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

  const provider = getActiveAIProvider();

  return retryWithBackoff(async () => {
    const preparedMessages = await buildMessagesWithSystemPrompt(messages, useSearch);

    if (provider === 'perplexity') {
      return await callPerplexityChatCompletion(preparedMessages);
    }

    const modelName = process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo';
    return await callOpenAIChatCompletion(preparedMessages, modelName);
  }, 3, 2000);
};

// AI 응답 스트리밍
export const generateAIResponseStream = async (
  messages: ChatMessage[],
  useSearch: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  if (process.env.REACT_APP_BACKEND_URL) {
    throw new Error('백엔드 연동 모드에서는 스트리밍 응답이 아직 지원되지 않습니다.');
  }

  const provider = getActiveAIProvider();

  return retryWithBackoff(async () => {
    const preparedMessages = await buildMessagesWithSystemPrompt(messages, useSearch);

    if (provider === 'perplexity') {
      return await callPerplexityStreamCompletion(preparedMessages, onChunk);
    }

    const modelName = process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo';
    return await callOpenAIStreamCompletion(preparedMessages, modelName, onChunk);
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

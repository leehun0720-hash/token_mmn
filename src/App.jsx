import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';
import { 
  Activity, DollarSign, Database, Terminal, Cpu, Play, RefreshCw, 
  Layers, Trash2, AlertTriangle, Settings, X, ShieldAlert, CheckCircle, 
  HelpCircle, BookOpen, Plus, Info, Key, Send, Copy, ArrowRight, UploadCloud
} from 'lucide-react';

// 인라인 깃허브 SVG 아이콘 선언
const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

// 1. 초기 기본 모델 및 단가 설정 (1K 토큰 기준 USD)
const INITIAL_PRICING = {
  'GPT-4o': { input: 0.005, output: 0.015, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', key: 'gpt4o', isCustom: false },
  'GPT-3.5 Turbo': { input: 0.0005, output: 0.0015, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.3)', key: 'gpt35', isCustom: false },
  'Gemini 1.5 Pro': { input: 0.0035, output: 0.0105, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', key: 'geminiPro', isCustom: false },
  'Gemini 1.5 Flash': { input: 0.000075, output: 0.0003, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.3)', key: 'geminiFlash', isCustom: false },
  'Claude 3.5 Sonnet': { input: 0.003, output: 0.015, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)', key: 'claudeSonnet', isCustom: false },
  'Claude 3 Opus': { input: 0.015, output: 0.075, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', key: 'claudeOpus', isCustom: false },
  'Llama 3.1 70B': { input: 0.0007, output: 0.0009, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', key: 'llama', isCustom: false },
};

// 2. 초기 기본 사용 제한 한도 설정 (토큰 수)
const INITIAL_LIMITS = {
  'GPT-4o': 500000,
  'GPT-3.5 Turbo': 1000000,
  'Gemini 1.5 Pro': 400000,
  'Gemini 1.5 Flash': 3000000,
  'Claude 3.5 Sonnet': 400000,
  'Claude 3 Opus': 200000,
  'Llama 3.1 70B': 1500000,
};

// 베이스 모델 템플릿 정보
const BASE_MODEL_TEMPLATES = {
  'GPT-4o': { input: 0.005, output: 0.015, limit: 500000, contextWindow: '128,000 (12.8만)', maxOutput: '4,096' },
  'GPT-3.5 Turbo': { input: 0.0005, output: 0.0015, limit: 1000000, contextWindow: '16,385 (1.6만)', maxOutput: '4,096' },
  'Gemini 1.5 Pro': { input: 0.0035, output: 0.0105, limit: 400000, contextWindow: '2,000,000 (200만)', maxOutput: '8,192' },
  'Gemini 1.5 Flash': { input: 0.000075, output: 0.0003, limit: 3000000, contextWindow: '1,000,000 (100만)', maxOutput: '8,192' },
  'Claude 3.5 Sonnet': { input: 0.003, output: 0.015, limit: 400000, contextWindow: '200,000 (20만)', maxOutput: '8,192' },
  'Claude 3 Opus': { input: 0.015, output: 0.075, limit: 200000, contextWindow: '200,000 (20만)', maxOutput: '4,096' },
  'Llama 3.1 70B': { input: 0.0007, output: 0.0009, limit: 1500000, contextWindow: '128,000 (12.8만)', maxOutput: '4,096' },
};

// 3. 초기 모의 일자별 차트 데이터
const INITIAL_USAGE_DATA = [
  { date: '06-15', gpt4o: 15000, gpt35: 60000, geminiPro: 12000, geminiFlash: 120000, claudeSonnet: 22000, claudeOpus: 5000, llama: 65000 },
  { date: '06-16', gpt4o: 10000, gpt35: 35000, geminiPro: 6000, geminiFlash: 75000, claudeSonnet: 18000, claudeOpus: 8000, llama: 40000 },
  { date: '06-17', gpt4o: 25000, gpt35: 80000, geminiPro: 18000, geminiFlash: 150000, claudeSonnet: 35000, claudeOpus: 10000, llama: 80000 },
  { date: '06-18', gpt4o: 18000, gpt35: 50000, geminiPro: 14000, geminiFlash: 110000, claudeSonnet: 28000, claudeOpus: 4000, llama: 55000 },
  { date: '06-19', gpt4o: 30000, gpt35: 95000, geminiPro: 25000, geminiFlash: 180000, claudeSonnet: 45000, claudeOpus: 12000, llama: 90000 },
  { date: '06-20', gpt4o: 0, gpt35: 0, geminiPro: 0, geminiFlash: 0, claudeSonnet: 0, claudeOpus: 0, llama: 0 },
];

const INITIAL_LOGS = [
  { id: 1, time: '09:15 AM', model: 'Claude 3.5 Sonnet', type: '코드 리뷰 및 분석', input: 8500, output: 2500, date: '06-20' },
  { id: 2, time: '06-19 10:45 AM', model: 'GPT-4o', type: '데이터 정제 스크립트 실행', input: 12000, output: 4000, date: '06-19' },
  { id: 3, time: '06-19 10:02 AM', model: 'Gemini 1.5 Pro', type: '다국어 문서 번역', input: 15000, output: 12000, date: '06-19' },
  { id: 4, time: '06-19 09:30 AM', model: 'Gemini 1.5 Flash', type: '로그 이상 탐지 시계열 처리', input: 45000, output: 1500, date: '06-19' },
];

const COLOR_PRESETS = [
  { name: 'Emerald', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
  { name: 'Indigo', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)' },
  { name: 'Purple', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
  { name: 'Pink', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)' },
  { name: 'Orange', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' },
  { name: 'Sky Blue', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.3)' },
  { name: 'Amber', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
];

export default function TokenManagerApp() {
  // --- 1. 대시보드 상태 관리 (LocalStorage 연동) ---
  const [pricing, setPricing] = useState(() => {
    const saved = localStorage.getItem('token_manager_pricing');
    return saved ? JSON.parse(saved) : INITIAL_PRICING;
  });
  const [limits, setLimits] = useState(() => {
    const saved = localStorage.getItem('token_manager_limits');
    return saved ? JSON.parse(saved) : INITIAL_LIMITS;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('token_manager_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });
  const [usageData, setUsageData] = useState(() => {
    const saved = localStorage.getItem('token_manager_usage_data');
    return saved ? JSON.parse(saved) : INITIAL_USAGE_DATA;
  });

  // API Key 보관 상태
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('token_manager_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('token_manager_openai_key') || '');

  // 탭 네비게이션 상태 ('dashboard' | 'playground' | 'ingress')
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterModel, setFilterModel] = useState('All');

  // 모달 토글 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false); // API 키 설정창
  const [editingModel, setEditingModel] = useState(null);
  const [quotaAlert, setQuotaAlert] = useState(null);

  // 로컬스토리지 동기화 이펙트
  useEffect(() => {
    localStorage.setItem('token_manager_pricing', JSON.stringify(pricing));
  }, [pricing]);
  useEffect(() => {
    localStorage.setItem('token_manager_limits', JSON.stringify(limits));
  }, [limits]);
  useEffect(() => {
    localStorage.setItem('token_manager_logs', JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem('token_manager_usage_data', JSON.stringify(usageData));
  }, [usageData]);
  useEffect(() => {
    localStorage.setItem('token_manager_gemini_key', geminiKey);
  }, [geminiKey]);
  useEffect(() => {
    localStorage.setItem('token_manager_openai_key', openaiKey);
  }, [openaiKey]);

  // --- 2. 입력 폼 상태 관리 ---
  const [selectedTemplate, setSelectedTemplate] = useState('Custom');
  const [newModelName, setNewModelName] = useState('');
  const [newInputPrice, setNewInputPrice] = useState('0.005');
  const [newOutputPrice, setNewOutputPrice] = useState('0.015');
  const [newLimit, setNewLimit] = useState('500000');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const [editInputPrice, setEditInputPrice] = useState('');
  const [editOutputPrice, setEditOutputPrice] = useState('');
  const [editLimit, setEditLimit] = useState('');

  const [simModel, setSimModel] = useState('GPT-4o');
  const [simType, setSimType] = useState('유닛 테스트 코드 생성');
  const [simInput, setSimInput] = useState(8000);
  const [simOutput, setSimOutput] = useState(2500);

  const [liveModel, setLiveModel] = useState('Gemini 1.5 Flash');
  const [livePrompt, setLivePrompt] = useState('피보나치 수열을 출력하는 파이썬 코드를 작성해 줘.');
  const [liveResponse, setLiveResponse] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveUsage, setLiveUsage] = useState(null);

  const [pasteLogs, setPasteLogs] = useState('');
  const [parseResult, setParseResult] = useState(null);

  // --- 3. 통계 및 수치 산출 로직 ---
  const modelOffset = {
    'GPT-4o': 200000,
    'GPT-3.5 Turbo': 600000,
    'Gemini 1.5 Pro': 150000,
    'Gemini 1.5 Flash': 1800000,
    'Claude 3.5 Sonnet': 150000,
    'Claude 3 Opus': 80000,
    'Llama 3.1 70B': 800000,
  };

  const usageByModel = useMemo(() => {
    const usages = {};
    Object.keys(pricing).forEach(model => {
      usages[model] = modelOffset[model] || 0;
    });

    logs.forEach(log => {
      if (usages[log.model] !== undefined) {
        usages[log.model] += (log.input + log.output);
      }
    });
    return usages;
  }, [logs, pricing]);

  const stats = useMemo(() => {
    const totalCost = logs.reduce((acc, log) => {
      const price = pricing[log.model];
      if (!price) return acc;
      const c = ((log.input / 1000) * price.input) + ((log.output / 1000) * price.output);
      return acc + c;
    }, 0) + 42.85;

    const totalTokens = Object.values(usageByModel).reduce((acc, val) => acc + val, 0);
    const activeSessions = new Set(logs.map(log => log.model)).size;

    return { totalCost, totalTokens, activeSessions };
  }, [logs, usageByModel, pricing]);

  const filteredLogs = useMemo(() => {
    if (filterModel === 'All') return logs;
    return logs.filter(log => log.model === filterModel);
  }, [logs, filterModel]);

  // --- 4. 외부 로그 파서 로직 ---
  const handleParseLogs = () => {
    if (!pasteLogs.trim()) {
      setParseResult(null);
      return;
    }

    let detectedModel = 'GPT-4o';
    const textLower = pasteLogs.toLowerCase();
    if (textLower.includes('gemini 1.5 pro') || textLower.includes('gemini-1.5-pro')) {
      detectedModel = 'Gemini 1.5 Pro';
    } else if (textLower.includes('gemini 1.5 flash') || textLower.includes('gemini-1.5-flash')) {
      detectedModel = 'Gemini 1.5 Flash';
    } else if (textLower.includes('claude 3.5 sonnet') || textLower.includes('sonnet')) {
      detectedModel = 'Claude 3.5 Sonnet';
    } else if (textLower.includes('opus')) {
      detectedModel = 'Claude 3 Opus';
    } else if (textLower.includes('gpt-3.5') || textLower.includes('gpt35')) {
      detectedModel = 'GPT-3.5 Turbo';
    } else if (textLower.includes('llama')) {
      detectedModel = 'Llama 3.1 70B';
    } else if (textLower.includes('gpt-4o') || textLower.includes('gpt4o')) {
      detectedModel = 'GPT-4o';
    }

    const inputRegexes = [
      /(?:input|prompt|입력|요청)(?:\s*tokens?)?[:\s\-=]+([0-9,]+)/i,
      /([0-9,]+)\s*(?:input|prompt|입력)\s*tokens?/i
    ];
    const outputRegexes = [
      /(?:output|completion|출력|응답)(?:\s*tokens?)?[:\s\-=]+([0-9,]+)/i,
      /([0-9,]+)\s*(?:output|completion|출력|응답)\s*tokens?/i
    ];

    let inputTokens = 0;
    let outputTokens = 0;

    for (let r of inputRegexes) {
      const match = pasteLogs.match(r);
      if (match) {
        inputTokens = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    for (let r of outputRegexes) {
      const match = pasteLogs.match(r);
      if (match) {
        outputTokens = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    if (inputTokens > 0 || outputTokens > 0) {
      setParseResult({
        model: detectedModel,
        input: inputTokens,
        output: outputTokens,
        parsedOk: true,
        error: null
      });
    } else {
      setParseResult({
        parsedOk: false,
        error: '입력/출력 토큰 크기를 추출할 수 없습니다. "입력: 1,500 / 출력: 800" 형태로 기입하세요.'
      });
    }
  };

  const handleIngestParsedLog = () => {
    if (!parseResult || !parseResult.parsedOk) return;

    const reqTotal = parseResult.input + parseResult.output;
    const currentUsage = usageByModel[parseResult.model] || 0;
    const limit = limits[parseResult.model] || 0;

    if (currentUsage + reqTotal > limit) {
      setQuotaAlert({
        model: parseResult.model,
        limit: limit,
        current: currentUsage,
        requested: reqTotal
      });
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newLog = {
      id: Date.now(),
      time: timeString,
      model: parseResult.model,
      type: '외부 에이전트 로그 수집 주입',
      input: parseResult.input,
      output: parseResult.output,
      date: '06-20'
    };

    setLogs(prev => [newLog, ...prev]);

    setUsageData(prev => {
      return prev.map(item => {
        if (item.date === '06-20') {
          const modelKey = pricing[parseResult.model].key;
          return {
            ...item,
            [modelKey]: (item[modelKey] || 0) + reqTotal
          };
        }
        return item;
      });
    });

    setPasteLogs('');
    setParseResult(null);
    alert('외부 에이전트 토큰 로그가 성공적으로 합산 누적되었습니다!');
  };

  // --- 5. 실제 AI API 실시간 호출 핸들러 ---
  const handleLiveAPICall = async (e) => {
    e.preventDefault();
    if (!livePrompt.trim()) return;

    setLiveResponse('');
    setLiveUsage(null);
    
    const isGemini = liveModel.startsWith('Gemini');
    const isOpenAI = liveModel.startsWith('GPT');

    if (isGemini && !geminiKey) {
      alert('Gemini API Key가 비어 있습니다. 헤더의 API Key 설정에서 키를 먼저 등록해 주세요.');
      return;
    }
    if (isOpenAI && !openaiKey) {
      alert('OpenAI API Key가 비어 있습니다. 헤더의 API Key 설정에서 키를 먼저 등록해 주세요.');
      return;
    }

    setLiveLoading(true);

    try {
      if (isGemini) {
        const modelEndpoint = liveModel === 'Gemini 1.5 Pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${geminiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: livePrompt }] }]
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Gemini API 호출 중 오류 발생');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답 텍스트를 파싱할 수 없습니다.';
        const promptTokens = data.usageMetadata?.promptTokenCount || 20;
        const completionTokens = data.usageMetadata?.candidatesTokenCount || 100;
        
        setLiveResponse(text);
        
        const price = pricing[liveModel];
        const cost = ((promptTokens / 1000) * price.input) + ((completionTokens / 1000) * price.output);
        setLiveUsage({ promptTokens, completionTokens, cost });

        addLiveLogToDashboard(liveModel, `[라이브 호출] ${livePrompt.substring(0, 20)}...`, promptTokens, completionTokens);

      } else if (isOpenAI) {
        const modelEndpoint = liveModel === 'GPT-4o' ? 'gpt-4o' : 'gpt-3.5-turbo';
        const url = 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: modelEndpoint,
            messages: [{ role: 'user', content: livePrompt }]
          })
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || 'OpenAI API 호출 중 오류 발생');
        }

        const text = data.choices?.[0]?.message?.content || '응답 텍스트를 파싱할 수 없습니다.';
        const promptTokens = data.usage?.prompt_tokens || 20;
        const completionTokens = data.usage?.completion_tokens || 100;

        setLiveResponse(text);

        const price = pricing[liveModel];
        const cost = ((promptTokens / 1000) * price.input) + ((completionTokens / 1000) * price.output);
        setLiveUsage({ promptTokens, completionTokens, cost });

        addLiveLogToDashboard(liveModel, `[라이브 호출] ${livePrompt.substring(0, 20)}...`, promptTokens, completionTokens);
      }
    } catch (err) {
      console.error(err);
      setLiveResponse(`API 통신 에러가 발생했습니다:\n${err.message}`);
    } finally {
      setLiveLoading(false);
    }
  };

  const addLiveLogToDashboard = (modelName, typeText, inputCount, outputCount) => {
    const total = inputCount + outputCount;
    
    const currentUsed = usageByModel[modelName] || 0;
    const limit = limits[modelName] || 0;
    if (currentUsed + total > limit) {
      setTimeout(() => {
        alert(`🚨 [경고] ${modelName} 모델의 실제 토큰 사용량이 Quota 제한 한도(${limit.toLocaleString()} 토큰)를 초과하여 경고 게이지가 켜졌습니다.`);
      }, 500);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newLog = {
      id: Date.now(),
      time: timeString,
      model: modelName,
      type: typeText,
      input: inputCount,
      output: outputCount,
      date: '06-20'
    };

    setLogs(prev => [newLog, ...prev]);

    setUsageData(prev => {
      return prev.map(item => {
        if (item.date === '06-20') {
          const modelKey = pricing[modelName].key;
          return {
            ...item,
            [modelKey]: (item[modelKey] || 0) + total
          };
        }
        return item;
      });
    });
  };

  // --- 6. 템플릿 변환 및 기본 CRUD 서브루틴 ---
  const handleAddCustomModelSubmit = (e) => {
    e.preventDefault();
    const nameTrimmed = newModelName.trim();
    if (!nameTrimmed) return;
    if (pricing[nameTrimmed]) {
      alert('이미 등록된 모델명이 있습니다.');
      return;
    }

    const key = 'custom_' + nameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    const colorTheme = COLOR_PRESETS[selectedColorIndex];

    setPricing(prev => ({
      ...prev,
      [nameTrimmed]: {
        input: parseFloat(newInputPrice),
        output: parseFloat(newOutputPrice),
        color: colorTheme.color,
        bg: colorTheme.bg,
        border: colorTheme.border,
        key: key,
        isCustom: true
      }
    }));

    setLimits(prev => ({
      ...prev,
      [nameTrimmed]: parseInt(newLimit)
    }));

    setSimModel(nameTrimmed);
    setShowAddModal(false);
    setNewModelName('');
  };

  const handleSimulateCall = (e) => {
    e.preventDefault();
    const reqTotal = parseInt(simInput) + parseInt(simOutput);
    const currentUsage = usageByModel[simModel] || 0;
    const limit = limits[simModel] || 0;

    if (currentUsage + reqTotal > limit) {
      setQuotaAlert({
        model: simModel,
        limit: limit,
        current: currentUsage,
        requested: reqTotal
      });
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newLog = {
      id: Date.now(),
      time: timeString,
      model: simModel,
      type: simType,
      input: parseInt(simInput),
      output: parseInt(simOutput),
      date: '06-20'
    };
    setLogs(prev => [newLog, ...prev]);

    setUsageData(prev => {
      return prev.map(item => {
        if (item.date === '06-20') {
          const modelKey = pricing[simModel].key;
          return {
            ...item,
            [modelKey]: (item[modelKey] || 0) + reqTotal
          };
        }
        return item;
      });
    });
  };

  const handleDeleteLog = (id) => {
    const targetLog = logs.find(log => log.id === id);
    if (!targetLog) return;

    setLogs(prev => prev.filter(log => log.id !== id));

    const reqTotal = targetLog.input + targetLog.output;
    setUsageData(prev => {
      return prev.map(item => {
        if (item.date === targetLog.date) {
          const modelKey = pricing[targetLog.model]?.key;
          if (modelKey) {
            const updatedVal = Math.max(0, (item[modelKey] || 0) - reqTotal);
            return { ...item, [modelKey]: updatedVal };
          }
        }
        return item;
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/5 rounded-full blur-[120px] animate-pulse-slow"></div>

      {/* 1. API 키 설정 모달 */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative glow-blue animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold font-outfit text-white mb-2 flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" />
              실시간 AI API Key 설정
            </h3>
            <p className="text-slate-400 text-xs mb-5">
              브라우저에서 직접 AI 서버로 질문을 전송하고 실제 사용 토큰을 받기 위한 API Key를 등록합니다. 이 키는 로컬 브라우저에만 저장됩니다.
            </p>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold transition-all cursor-pointer text-center"
                >
                  설정 저장 및 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 사용 안내 모달 */}
      {showGuide && (
        <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[85vh] overflow-y-auto glow-purple animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 text-indigo-400 mb-6">
              <BookOpen className="h-7 w-7 stroke-[2]" />
              <h3 className="text-xl font-bold font-outfit text-white">사용법 및 자원 관리 매뉴얼</h3>
            </div>
            
            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
              <section className="space-y-2">
                <h4 className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  1. 내 AI 서비스 / 에이전트 신규 등록
                </h4>
                <p className="pl-3 text-slate-400 text-xs">
                  상단 헤더의 <b>[+ 새 서비스 등록]</b> 버튼을 통해 신규 서비스를 신설합니다. 이름, 입/출력 토큰당 단가 요율, 최초 Quota 제한량 및 색상을 선택하면 대시보드 시스템에 등록됩니다. **서비스 템플릿 드롭다운**을 선택하면 기본 베이스 모델의 입출력 요율 정보 및 최대 컨텍스트 윈도우 스펙이 자동으로 노출됩니다.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  2. 요율 및 한도(Quota) 직접 제어
                </h4>
                <p className="pl-3 text-slate-400 text-xs">
                  우측 하단 <b>'서비스 통합 콘솔'</b>에서 각 서비스 옆의 **[관리]** 버튼을 눌러 제한 한도량(토큰 수)과 1K당 입출력 요금을 수동 수정할 수 있습니다.
                </p>
                <ul className="pl-6 list-disc text-slate-400 text-xs space-y-1">
                  <li><b>게이지바 임계치</b>: 사용량이 한도의 80% 미만이면 <span className="text-emerald-400 font-semibold">녹색</span>, 80%~100%는 <span className="text-amber-400 font-semibold">주황색</span>, 100% 초과는 <span className="text-rose-400 font-semibold">적색</span>으로 표기됩니다.</li>
                  <li><b>호출 차단</b>: 100% 한도를 넘긴 모델로 API 테스트 호출 시 경고 모달과 함께 신규 동작이 완전 차단됩니다.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  3. 가상 API 테스트 시뮬레이션
                </h4>
                <p className="pl-3 text-slate-400 text-xs">
                  사용자가 직접 추가한 커스텀 모델을 포함해, 드롭다운에서 서비스를 선택하고 프롬프트 크기를 기입해 호출을 전송할 수 있습니다. 호출 시 실시간으로 게이지가 상승하고 대시보드 그래프가 변동합니다.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  4. 개별 로그 삭제와 역산출 (Rollback)
                </h4>
                <p className="pl-3 text-slate-400 text-xs">
                  테이블 우측의 <Trash2 className="inline h-3.5 w-3.5 text-slate-500" /> 버튼으로 개별 API 로그를 삭제하면, 해당 로그의 비용 및 토큰 사용량이 대시보드의 **모든 통계 카드와 일일 차트 점수에서 즉각 빼기(역산) 처리**되어 데이터 정합성을 제공합니다.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 flex justify-end">
              <button 
                onClick={() => setShowGuide(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
              >
                가이드 확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 신규 모델 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative glow-blue animate-in fade-in zoom-in duration-200 space-y-4">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div>
              <h3 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                나만의 AI 서비스 에이전트 등록
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                요율과 한도를 직접 관리할 가상의 에이전트 서비스를 신설합니다.
              </p>
            </div>

            <form onSubmit={handleAddCustomModelSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  서비스 모델 템플릿 선택 (드롭다운)
                </label>
                <select 
                  value={selectedTemplate} 
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="Custom">직접 입력 (Custom)</option>
                  {Object.keys(BASE_MODEL_TEMPLATES).map(name => (
                    <option key={name} value={name}>{name} (기본 템플릿)</option>
                  ))}
                </select>
              </div>

              {selectedTemplate !== 'Custom' && (
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                    <Info className="h-3.5 w-3.5 text-indigo-400" />
                    {selectedTemplate} 기본 성능 제한 규격
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <div>• 최대 처리 한도 (Context): <span className="text-indigo-400 font-bold">{BASE_MODEL_TEMPLATES[selectedTemplate].contextWindow}</span></div>
                    <div>• 최대 출력 한도 (Output): <span className="text-indigo-400 font-bold">{BASE_MODEL_TEMPLATES[selectedTemplate].maxOutput}</span></div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">서비스/모델 이름</label>
                <input 
                  type="text" 
                  value={newModelName} 
                  onChange={(e) => setNewModelName(e.target.value)}
                  required 
                  placeholder="예: Custom Coder v2, Llama 3 Fine-tune"
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">입력 요율 ($ / 1K 토큰)</label>
                  <input 
                    type="number" 
                    step="0.0001" 
                    min="0"
                    value={newInputPrice} 
                    onChange={(e) => setNewInputPrice(e.target.value)}
                    required
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">출력 요율 ($ / 1K 토큰)</label>
                  <input 
                    type="number" 
                    step="0.0001" 
                    min="0"
                    value={newOutputPrice} 
                    onChange={(e) => setNewOutputPrice(e.target.value)}
                    required
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">최대 사용량 제한 (Quota 토큰 수)</label>
                <input 
                  type="number" 
                  step="50000" 
                  min="10000"
                  value={newLimit} 
                  onChange={(e) => setNewLimit(e.target.value)}
                  required
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">시각화 테마 색상 선택</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((theme, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setSelectedColorIndex(i)}
                      style={{ backgroundColor: theme.color }}
                      className={`h-6 w-6 rounded-full border-2 transition-all cursor-pointer ${selectedColorIndex === i ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      title={theme.name}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 모델 수정 모달 */}
      {editingModel && (
        <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setEditingModel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold font-outfit text-white mb-1.5 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-indigo-400" />
              {editingModel} 서비스 설정 관리
            </h3>
            <form onSubmit={handleSaveEditModel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">입력 단가 ($ / 1K)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    min="0"
                    value={editInputPrice} 
                    onChange={(e) => setEditInputPrice(e.target.value)}
                    required
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">출력 단가 ($ / 1K)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    min="0"
                    value={editOutputPrice} 
                    onChange={(e) => setEditOutputPrice(e.target.value)}
                    required
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">최대 Quota 제한 (토큰 수)</label>
                <input 
                  type="number" 
                  step="50000"
                  min="5000"
                  value={editLimit} 
                  onChange={(e) => setEditLimit(e.target.value)}
                  required
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingModel(null)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 py-2 rounded-xl font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-colors cursor-pointer"
                >
                  수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Quota 초과 경고 팝업 */}
      {quotaAlert && (
        <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative glow-orange animate-in fade-in zoom-in duration-150">
            <button 
              onClick={() => setQuotaAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <ShieldAlert className="h-8 w-8 stroke-[2.5]" />
              <h3 className="text-lg font-bold font-outfit text-white">사용 제한 한도 초과 (Quota Exceeded)</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              선택한 서비스 모델 <span className="text-indigo-400 font-semibold">{quotaAlert.model}</span>의 잔여 토큰 한도가 부족하여 신규 API 호출 시뮬레이션을 실행할 수 없습니다.
            </p>
            <div className="bg-[#0a0f1d] rounded-xl p-4 space-y-2 border border-slate-800/80 mb-6 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">설정된 Quota 제한:</span>
                <span className="text-slate-300">{quotaAlert.limit.toLocaleString()} 토큰</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">현재 누적 사용량:</span>
                <span className="text-slate-300">{quotaAlert.current.toLocaleString()} 토큰</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2 text-red-400 font-bold">
                <span>추가 발생할 토큰량:</span>
                <span>+{quotaAlert.requested.toLocaleString()} 토큰</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setQuotaAlert(null)}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                닫기
              </button>
              <button 
                onClick={() => {
                  setQuotaAlert(null);
                  setEditingModel(quotaAlert.model);
                  setEditInputPrice(pricing[quotaAlert.model].input.toString());
                  setEditOutputPrice(pricing[quotaAlert.model].output.toString());
                  setEditLimit(quotaAlert.limit.toString());
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
              >
                한도 제한 늘리기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 본문 콘텐츠 */}
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* 헤더 */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 pb-6 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold font-mono">Integrated LLM Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-outfit bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
              🚀 통합 AI 토큰 매니저
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              에이전트 / 모델 신규 동적 등록 • Quota 실시간 관제 • 외부 로그 정규식 주입기 • 실제 API 라이브 연동
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-5 md:mt-0 flex-wrap">
            {/* 개인화된 깃허브 프로필 배지 */}
            <a 
              href="https://github.com/leehun0720-hash" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-400/60 transition-all cursor-pointer group shadow-lg"
              title="Leehun0720-hash 깃허브 프로필로 이동"
            >
              <div className="relative">
                <img 
                  src="https://github.com/leehun0720-hash.png" 
                  alt="Github Profile" 
                  className="h-7 w-7 rounded-full border border-indigo-500/40 object-cover"
                  onError={(e) => {
                    // 이미지 로드 에러 시 깃허브 기본 마크 아이콘으로 대체
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-0.5 border border-slate-800">
                  <GithubIcon className="h-3 w-3 text-slate-300" />
                </div>
              </div>
              <div className="text-[10px] text-left leading-tight hidden sm:block">
                <p className="text-slate-500 font-medium group-hover:text-slate-400 transition-colors">Developer</p>
                <p className="text-slate-200 font-bold font-mono tracking-tight group-hover:text-indigo-300 transition-colors">leehun0720-hash</p>
              </div>
            </a>

            <button 
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <Key className="h-4 w-4 text-indigo-400" />
              API Key 설정
              {(geminiKey || openaiKey) ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-600"></span>
              )}
            </button>
            <button 
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-indigo-400" />
              사용법 매뉴얼
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              새 서비스 등록
            </button>
            <button 
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-semibold hover:bg-red-900/20 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              초기화
            </button>
          </div>
        </header>

        {/* 상단 통계 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            title="이번 달 누적 비용 (Estimated)" 
            value={`$${stats.totalCost.toFixed(3)}`} 
            icon={<DollarSign className="text-emerald-400 h-6 w-6" />}
            glowClass="glow-orange"
            description="현재 설정 단가 기준 누적 요금"
          />
          <Card 
            title="누적 사용 토큰합" 
            value={stats.totalTokens.toLocaleString()} 
            icon={<Database className="text-blue-400 h-6 w-6" />}
            glowClass="glow-blue"
            description="전체 등록 서비스 통합 토큰량"
          />
          <Card 
            title="활동 에이전트 / 서비스 수" 
            value={`${stats.activeSessions}개 서비스`} 
            icon={<Terminal className="text-purple-400 h-6 w-6" />}
            glowClass="glow-purple"
            description="최근 트래픽 로그 기준 모델 수"
          />
        </section>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-800/80 mb-8 gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'dashboard' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            📊 관제 대시보드
          </button>
          <button 
            onClick={() => setActiveTab('playground')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${activeTab === 'playground' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Send className="h-3.5 w-3.5 text-emerald-400" />
            라이브 API 테스터 (Playground)
          </button>
          <button 
            onClick={() => setActiveTab('ingress')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${activeTab === 'ingress' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
            외부 에이전트 로그 주입기
          </button>
        </div>

        {/* 탭 본문 분기 */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* 왼쪽 2열: 차트 영역 */}
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-panel p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                      <Layers className="text-indigo-400 h-5 w-5" />
                      모델별 누적 사용 비율 (Stacked Bar)
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">일자별 각 AI 모델이 기록한 토큰 총량</p>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${val/1000}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '10px', color: '#cbd5e1' }} />
                      {Object.entries(pricing).map(([modelName, info]) => (
                        <Bar key={info.key} dataKey={info.key} name={modelName} stackId="a" fill={info.color} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                      <Activity className="text-indigo-400 h-5 w-5" />
                      주요 모델 사용량 변동 (Line Trend)
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">날짜별 핵심 API 호출량 가시성 트렌드</p>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${val/1000}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#cbd5e1' }} />
                      {Object.entries(pricing).map(([modelName, info]) => (
                        <Line key={info.key} type="monotone" dataKey={info.key} name={modelName} stroke={info.color} strokeWidth={2.5} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 오른쪽 1열: 제어 & 관리 */}
            <div className="space-y-8">
              {/* 시뮬레이터 */}
              <div className="glass-panel p-6 rounded-2xl shadow-xl border border-indigo-500/10">
                <h2 className="text-lg font-bold text-white font-outfit mb-1 flex items-center gap-2">
                  <Cpu className="text-indigo-400 h-5 w-5" />
                  API 호출 시뮬레이터
                </h2>
                <p className="text-slate-400 text-xs mb-5">등록된 AI에 가상 호출 트래픽을 추가해 봅니다.</p>

                {Object.keys(pricing).length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">서비스 모델이 존재하지 않습니다.</div>
                ) : (
                  <form onSubmit={handleSimulateCall} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">사용 모델 선택</label>
                      <select 
                        value={simModel} 
                        onChange={(e) => setSimModel(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {Object.keys(pricing).map(modelName => (
                          <option key={modelName} value={modelName}>{modelName}</option>
                        ))}
                      </select>
                    </div>

                    {pricing[simModel] && (
                      <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-xl p-2.5 text-[10px] text-slate-400 space-y-0.5 font-mono">
                        <div className="flex justify-between">
                          <span>현재 모델 누적 사용:</span>
                          <span className="text-slate-200 font-bold">{(usageByModel[simModel] || 0).toLocaleString()} 토큰</span>
                        </div>
                        <div className="flex justify-between">
                          <span>설정된 토큰 Quota 한도:</span>
                          <span className="text-slate-200 font-bold">{(limits[simModel] || 0).toLocaleString()} 토큰</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">호출 작업 유형</label>
                      <input 
                        type="text" 
                        value={simType}
                        onChange={(e) => setSimType(e.target.value)}
                        required
                        placeholder="작업 내용 입력"
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">입력 토큰</label>
                        <input 
                          type="number" 
                          value={simInput}
                          min={100}
                          step={500}
                          onChange={(e) => setSimInput(e.target.value)}
                          className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">출력 토큰</label>
                        <input 
                          type="number" 
                          value={simOutput}
                          min={100}
                          step={500}
                          onChange={(e) => setSimOutput(e.target.value)}
                          className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="bg-[#0f172a] rounded-xl p-3 border border-slate-800/50 mb-3 text-xs">
                        {pricing[simModel] && (
                          <>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>호출 예상 요금:</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                ${((simInput / 1000) * pricing[simModel].input + (simOutput / 1000) * pricing[simModel].output).toFixed(4)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex justify-between">
                              <span>잔여 제한량:</span>
                              <span className="font-mono text-indigo-400">
                                {Math.max(0, (limits[simModel] || 0) - (usageByModel[simModel] || 0)).toLocaleString()} 토큰
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 rounded-xl shadow-lg text-xs cursor-pointer"
                      >
                        API 호출 시뮬레이션
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 서비스 통합 관리 센터 */}
              <div className="glass-panel p-6 rounded-2xl shadow-xl">
                <h2 className="text-base font-bold text-white font-outfit flex items-center gap-2 mb-4">
                  <Settings className="text-indigo-400 h-4 w-4" />
                  서비스 통합 관리 센터
                </h2>
                <div className="space-y-4">
                  {Object.keys(pricing).map((modelName) => {
                    const used = usageByModel[modelName] || 0;
                    const limit = limits[modelName] || 0;
                    const info = pricing[modelName];
                    const percent = Math.min(100, limit > 0 ? Math.round((used / limit) * 100) : 0);
                    
                    let barColor = 'bg-emerald-500';
                    let textColor = 'text-emerald-400';
                    if (percent >= 80 && percent < 100) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-400';
                    } else if (percent >= 100) {
                      barColor = 'bg-rose-500';
                      textColor = 'text-rose-400';
                    }

                    return (
                      <div key={modelName} className="space-y-1 bg-[#090d16]/50 p-2.5 rounded-xl border border-slate-800/40">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: info.color }} className="font-semibold flex items-center gap-1">
                            {modelName}
                            {info.isCustom && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded">Custom</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setEditingModel(modelName);
                                setEditInputPrice(info.input.toString());
                                setEditOutputPrice(info.output.toString());
                                setEditLimit(limit.toString());
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 cursor-pointer"
                            >
                              관리
                            </button>
                            {info.isCustom && (
                              <button onClick={() => handleDeleteCustomModel(modelName)} className="text-slate-500 hover:text-red-400 p-0.5 cursor-pointer">
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          1K당: 입력 ${info.input} / 출력 ${info.output}
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>사용: {used.toLocaleString()} / {limit.toLocaleString()} 토큰</span>
                          <span className={`font-bold ${textColor}`}>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 라이브 API 플레이그라운드 */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Send className="text-emerald-400 h-5 w-5" />
                      실시간 AI API 호출 Playground
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">실제 API Key를 사용해 질문을 던지고 토큰 결과를 수집합니다.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">API Key 상태:</span>
                    {(geminiKey || openaiKey) ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">연결 완료</span>
                    ) : (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">Key 필요</span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleLiveAPICall} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">사용할 AI 모델 선택</label>
                      <select 
                        value={liveModel} 
                        onChange={(e) => setLiveModel(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Gemini 1.5 Flash">Gemini 1.5 Flash (Google)</option>
                        <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Google)</option>
                        <option value="GPT-4o">GPT-4o (OpenAI)</option>
                        <option value="GPT-3.5 Turbo">GPT-3.5 Turbo (OpenAI)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        type="button"
                        onClick={() => setShowKeyModal(true)}
                        className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Key className="h-4 w-4 text-indigo-400" />
                        API Key 등록/수정하기
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">프롬프트 메시지 입력</label>
                    <textarea 
                      value={livePrompt}
                      onChange={(e) => setLivePrompt(e.target.value)}
                      rows="3"
                      required
                      placeholder="AI 모델에 전송할 프롬프트를 작성해 주세요..."
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-sans"
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={liveLoading}
                      className={`px-8 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all ${liveLoading ? 'bg-indigo-600/50 text-slate-400 font-medium' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}
                    >
                      {liveLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          API 통신 및 분석중...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          실시간 API 호출 발송
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">AI 응답 메시지 결과 (Live Response)</label>
                  <div className="bg-[#090d16] border border-slate-800/50 rounded-xl p-4 min-h-[140px] text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text overflow-y-auto max-h-[300px]">
                    {liveResponse || '아직 라이브 호출 내역이 없습니다. 프롬프트를 작성해 실제 응답 결과를 확인하세요.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white font-outfit flex items-center gap-1.5">
                  <Activity className="text-emerald-400 h-4.5 w-4.5" />
                  실시간 호출 토큰 계측기
                </h3>
                <p className="text-slate-400 text-xs leading-normal">
                  가장 최근에 실행한 실제 API 호출에 소비된 토큰 크기와 단가에 기반한 발생 비용입니다.
                </p>

                {liveUsage ? (
                  <div className="space-y-3.5 pt-2">
                    <div className="bg-[#0a0f1d] rounded-xl p-3.5 border border-slate-800 space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">호출 모델:</span>
                        <span className="text-white font-bold">{liveModel}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-850 pb-2">
                        <span className="text-slate-500">발생 비용:</span>
                        <span className="text-emerald-400 font-extrabold text-sm">${liveUsage.cost.toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">입력(Prompt) 토큰:</span>
                        <span className="text-blue-400 font-bold">{liveUsage.promptTokens.toLocaleString()} t</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">출력(Response) 토큰:</span>
                        <span className="text-orange-400 font-bold">{liveUsage.completionTokens.toLocaleString()} t</span>
                      </div>
                    </div>
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-400 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <b>대시보드 반영 성공!</b> 해당 사용량이 이번 달 누적량과 차트, 테이블 로그에 즉시 가산되었습니다.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    실시간 API를 호출하면 상세 계측 수치가 여기에 표출됩니다.
                  </div>
                )}
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-3.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1">
                  <Info className="text-indigo-400 h-4 w-4" />
                  API 요율 및 컨텍스트 정보
                </h3>
                <div className="space-y-2 text-xs text-slate-400 font-mono">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Gemini 1.5 Flash:</span>
                    <span>1M 한도 / $0.000075</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Gemini 1.5 Pro:</span>
                    <span>2M 한도 / $0.0035</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>GPT-4o:</span>
                    <span>128K 한도 / $0.005</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 외부 로그 주입기 */}
        {activeTab === 'ingress' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <UploadCloud className="text-indigo-400 h-5 w-5" />
                    외부 CLI / 에이전트 로그 수동 주입기 (Ingress Console)
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    로컬 터미널의 Claude Code 실행 내역 또는 API 로그 요약을 복사하여 붙여넣으면 토큰 사용량을 분석합니다.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      터미널 로그 또는 요약 텍스트 붙여넣기
                    </label>
                    <textarea 
                      value={pasteLogs}
                      onChange={(e) => setPasteLogs(e.target.value)}
                      rows="6"
                      placeholder="[여기에 터미널 로그를 복사해 붙여넣으세요]&#10;예시:&#10;hello, I spent 12,500 input tokens and 1,850 output tokens using Claude 3.5 Sonnet."
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-700 font-mono leading-relaxed"
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setPasteLogs(`[Claude Code CLI Output Example]
Command executed successfully.
Usage details:
- Model: Claude 3.5 Sonnet
- Prompt: 14,250 tokens (Input)
- Completion: 1,840 tokens (Output)
Total token count: 16,090 tokens.`)}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:text-white transition-colors cursor-pointer"
                    >
                      테스트 예문 로드
                    </button>
                    <button 
                      onClick={handleParseLogs}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                    >
                      로그 텍스트 분석
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white font-outfit flex items-center gap-1.5">
                  <Activity className="text-indigo-400 h-4.5 w-4.5" />
                  로그 데이터 추출 결과
                </h3>
                {parseResult ? (
                  <div className="space-y-4">
                    {parseResult.parsedOk ? (
                      <>
                        <div className="bg-[#0a0f1d] rounded-xl p-3.5 border border-slate-800 space-y-2.5 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">매칭된 모델:</span>
                            <span className="text-white font-bold">{parseResult.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">분석된 입력 토큰:</span>
                            <span className="text-blue-400 font-bold">{parseResult.input.toLocaleString()} t</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">분석된 출력 토큰:</span>
                            <span className="text-orange-400 font-bold">{parseResult.output.toLocaleString()} t</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-850 pt-2 text-slate-400 font-semibold">
                            <span>예상 발생 비용:</span>
                            <span className="text-emerald-400">
                              ${((parseResult.input / 1000) * pricing[parseResult.model].input + (parseResult.output / 1000) * pricing[parseResult.model].output).toFixed(4)}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={handleIngestParsedLog}
                          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-xs"
                        >
                          <Plus className="h-4 w-4" />
                          이 사용량 대시보드에 적재
                        </button>
                      </>
                    ) : (
                      <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-400 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <b>분석 실패:</b> {parseResult.error}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    좌측 폼에 터미널 로그 요약을 적고 [로그 텍스트 분석]을 실행해 주세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 테이블 */}
        <section className="glass-panel rounded-2xl shadow-xl overflow-hidden mb-10">
          <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-outfit">통합 API 호출 / 에이전트 이력 로그</h2>
              <p className="text-slate-400 text-xs mt-0.5">실시간 테스트 호출 및 수동 주입된 로그를 직접 삭제하여 누적 데이터를 롤백(Rollback)할 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-2 bg-[#090d16] px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">모델 필터:</span>
              <select 
                value={filterModel} 
                onChange={(e) => setFilterModel(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="All">전체 모델</option>
                {Object.keys(pricing).map(modelName => (
                  <option key={modelName} value={modelName}>{modelName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0c1222]/80 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">시간</th>
                  <th className="p-4">사용 모델</th>
                  <th className="p-4">작업 내용</th>
                  <th className="p-4 text-right">입력 토큰</th>
                  <th className="p-4 text-right">출력 토큰</th>
                  <th className="p-4 text-right">발생 비용</th>
                  <th className="p-4 text-center pr-6">제어</th>
                </tr>
              </thead>
              <tbody className="text-slate-300 divide-y divide-slate-800/40 text-sm">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                      출력 가능한 API 호출 로그가 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const price = pricing[log.model];
                    if (!price) return null;
                    const cost = ((log.input / 1000) * price.input) + ((log.output / 1000) * price.output);
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-6 text-xs text-slate-500 font-mono">{log.time}</td>
                        <td className="p-4">
                          <span 
                            style={{ 
                              color: price.color, 
                              backgroundColor: price.bg,
                              borderColor: price.border
                            }} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          >
                            {log.model}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-200">{log.type}</td>
                        <td className="p-4 text-right text-blue-400 font-mono font-semibold">{log.input.toLocaleString()}</td>
                        <td className="p-4 text-right text-orange-400 font-mono font-semibold">{log.output.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-400">${cost.toFixed(4)}</td>
                        <td className="p-4 text-center pr-6">
                          <button 
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="로그 삭제 (대시보드 역산)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// 재사용 가능한 요약 카드 컴포넌트
function Card({ title, value, icon, glowClass, description }) {
  return (
    <div className={`glass-panel p-6 rounded-2xl glass-panel-hover flex items-center space-x-5 relative overflow-hidden ${glowClass}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
      
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-white font-outfit mt-1 leading-none">
          {value}
        </p>
        <p className="text-[10px] text-slate-500 mt-1.5">{description}</p>
      </div>
    </div>
  );
}

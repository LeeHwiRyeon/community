const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// AI 컨텐츠 생성 요청 스키마
const contentGenerationRequest = {
    type: String, // 'article', 'blog', 'social', 'email', 'ad', 'product'
    topic: String,
    keywords: [String],
    tone: String, // 'professional', 'casual', 'friendly', 'formal', 'creative'
    length: String, // 'short', 'medium', 'long'
    language: String,
    targetAudience: String,
    style: String, // 'informative', 'persuasive', 'narrative', 'technical'
    includeImages: Boolean,
    includeCallToAction: Boolean,
    seoOptimized: Boolean,
    customPrompt: String
};

// AI 컨텐츠 최적화 요청 스키마
const contentOptimizationRequest = {
    content: String,
    optimizationType: String, // 'seo', 'readability', 'engagement', 'conversion'
    targetKeywords: [String],
    targetAudience: String,
    tone: String,
    maxLength: Number,
    minLength: Number,
    includeSuggestions: Boolean
};

// AI 컨텐츠 생성
router.post('/generate', async (req, res) => {
    try {
        const {
            type,
            topic,
            keywords = [],
            tone = 'professional',
            length = 'medium',
            language = 'ko',
            targetAudience,
            style = 'informative',
            includeImages = false,
            includeCallToAction = false,
            seoOptimized = true,
            customPrompt
        } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                message: '주제는 필수입니다.'
            });
        }

        // 프롬프트 생성
        const prompt = generateContentPrompt({
            type,
            topic,
            keywords,
            tone,
            length,
            language,
            targetAudience,
            style,
            includeImages,
            includeCallToAction,
            seoOptimized,
            customPrompt
        });

        // OpenAI API 호출
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "당신은 전문적인 컨텐츠 작가입니다. 주어진 요구사항에 따라 고품질의 컨텐츠를 생성해주세요."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: getMaxTokens(length),
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const generatedContent = completion.choices[0].message.content;

        // 컨텐츠 분석 및 메타데이터 생성
        const analysis = await analyzeGeneratedContent(generatedContent, {
            type,
            keywords,
            seoOptimized,
            targetAudience
        });

        // 이미지 제안 (필요한 경우)
        let imageSuggestions = [];
        if (includeImages) {
            imageSuggestions = await generateImageSuggestions(topic, keywords);
        }

        res.json({
            success: true,
            data: {
                content: generatedContent,
                metadata: {
                    wordCount: analysis.wordCount,
                    readingTime: analysis.readingTime,
                    readabilityScore: analysis.readabilityScore,
                    seoScore: analysis.seoScore,
                    sentiment: analysis.sentiment,
                    keywords: analysis.extractedKeywords,
                    topics: analysis.topics
                },
                suggestions: {
                    improvements: analysis.improvements,
                    imageSuggestions,
                    callToAction: includeCallToAction ? analysis.callToAction : null,
                    seoRecommendations: seoOptimized ? analysis.seoRecommendations : []
                },
                generationInfo: {
                    type,
                    topic,
                    tone,
                    length,
                    language,
                    generatedAt: new Date().toISOString(),
                    model: 'gpt-4'
                }
            }
        });

    } catch (error) {
        console.error('AI 컨텐츠 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AI 컨텐츠 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AI 컨텐츠 최적화
router.post('/optimize', async (req, res) => {
    try {
        const {
            content,
            optimizationType = 'seo',
            targetKeywords = [],
            targetAudience,
            tone = 'professional',
            maxLength,
            minLength,
            includeSuggestions = true
        } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '컨텐츠는 필수입니다.'
            });
        }

        // 최적화 프롬프트 생성
        const prompt = generateOptimizationPrompt({
            content,
            optimizationType,
            targetKeywords,
            targetAudience,
            tone,
            maxLength,
            minLength
        });

        // OpenAI API 호출
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "당신은 컨텐츠 최적화 전문가입니다. 주어진 컨텐츠를 요구사항에 맞게 최적화해주세요."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.5
        });

        const optimizedContent = completion.choices[0].message.content;

        // 최적화 분석
        const analysis = await analyzeOptimizedContent(content, optimizedContent, {
            optimizationType,
            targetKeywords,
            targetAudience
        });

        res.json({
            success: true,
            data: {
                originalContent: content,
                optimizedContent: optimizedContent,
                improvements: {
                    seoScore: analysis.seoScore,
                    readabilityScore: analysis.readabilityScore,
                    engagementScore: analysis.engagementScore,
                    wordCountChange: analysis.wordCountChange,
                    keywordDensity: analysis.keywordDensity,
                    sentimentChange: analysis.sentimentChange
                },
                suggestions: includeSuggestions ? analysis.suggestions : [],
                optimizationInfo: {
                    type: optimizationType,
                    targetKeywords,
                    targetAudience,
                    tone,
                    optimizedAt: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('AI 컨텐츠 최적화 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AI 컨텐츠 최적화 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AI 컨텐츠 아이디어 생성
router.post('/ideas', async (req, res) => {
    try {
        const {
            industry,
            topic,
            keywords = [],
            contentType = 'blog',
            count = 5,
            language = 'ko'
        } = req.body;

        if (!industry || !topic) {
            return res.status(400).json({
                success: false,
                message: '산업과 주제는 필수입니다.'
            });
        }

        const prompt = generateIdeasPrompt({
            industry,
            topic,
            keywords,
            contentType,
            count,
            language
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "당신은 창의적인 컨텐츠 기획자입니다. 주어진 조건에 맞는 다양한 컨텐츠 아이디어를 제안해주세요."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.8
        });

        const ideas = JSON.parse(completion.choices[0].message.content);

        res.json({
            success: true,
            data: {
                ideas: ideas.ideas || [],
                industry,
                topic,
                contentType,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI 아이디어 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AI 아이디어 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AI 컨텐츠 번역
router.post('/translate', async (req, res) => {
    try {
        const {
            content,
            targetLanguage = 'en',
            sourceLanguage = 'ko',
            preserveFormatting = true,
            tone = 'professional'
        } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '컨텐츠는 필수입니다.'
            });
        }

        const prompt = generateTranslationPrompt({
            content,
            targetLanguage,
            sourceLanguage,
            preserveFormatting,
            tone
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "당신은 전문 번역가입니다. 주어진 컨텐츠를 자연스럽고 정확하게 번역해주세요."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.3
        });

        const translatedContent = completion.choices[0].message.content;

        res.json({
            success: true,
            data: {
                originalContent: content,
                translatedContent: translatedContent,
                sourceLanguage,
                targetLanguage,
                translatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI 번역 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AI 번역 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AI 컨텐츠 요약
router.post('/summarize', async (req, res) => {
    try {
        const {
            content,
            summaryType = 'brief', // 'brief', 'detailed', 'bullet', 'executive'
            maxLength = 200,
            includeKeyPoints = true,
            language = 'ko'
        } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '컨텐츠는 필수입니다.'
            });
        }

        const prompt = generateSummaryPrompt({
            content,
            summaryType,
            maxLength,
            includeKeyPoints,
            language
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "당신은 전문 요약가입니다. 주어진 컨텐츠를 요구사항에 맞게 요약해주세요."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.3
        });

        const summary = completion.choices[0].message.content;

        res.json({
            success: true,
            data: {
                originalContent: content,
                summary: summary,
                summaryType,
                maxLength,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI 요약 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AI 요약 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// AI 컨텐츠 분석
router.post('/analyze', async (req, res) => {
    try {
        const {
            content,
            analysisType = 'comprehensive', // 'comprehensive', 'seo', 'readability', 'sentiment'
            includeSuggestions = true
        } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '컨텐츠는 필수입니다.'
            });
        }

        const analysis = await performContentAnalysis(content, analysisType);

        res.json({
            success: true,
            data: {
                content: content,
                analysis: analysis,
                analysisType,
                analyzedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI 컨텐츠 분석 오류:', error);
        res.status(500).json({
            success: false,
            message: 'AI 컨텐츠 분석 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 헬퍼 함수들

function generateContentPrompt(options) {
    const {
        type,
        topic,
        keywords,
        tone,
        length,
        language,
        targetAudience,
        style,
        includeImages,
        includeCallToAction,
        seoOptimized,
        customPrompt
    } = options;

    let prompt = `다음 요구사항에 따라 ${type} 컨텐츠를 생성해주세요:\n\n`;
    prompt += `주제: ${topic}\n`;

    if (keywords.length > 0) {
        prompt += `키워드: ${keywords.join(', ')}\n`;
    }

    prompt += `톤: ${tone}\n`;
    prompt += `길이: ${length}\n`;
    prompt += `언어: ${language}\n`;
    prompt += `스타일: ${style}\n`;

    if (targetAudience) {
        prompt += `타겟 오디언스: ${targetAudience}\n`;
    }

    if (seoOptimized) {
        prompt += `SEO 최적화: 예\n`;
    }

    if (includeCallToAction) {
        prompt += `CTA 포함: 예\n`;
    }

    if (customPrompt) {
        prompt += `추가 요구사항: ${customPrompt}\n`;
    }

    prompt += `\n고품질의 ${type} 컨텐츠를 생성해주세요.`;

    return prompt;
}

function generateOptimizationPrompt(options) {
    const {
        content,
        optimizationType,
        targetKeywords,
        targetAudience,
        tone,
        maxLength,
        minLength
    } = options;

    let prompt = `다음 컨텐츠를 ${optimizationType} 관점에서 최적화해주세요:\n\n`;
    prompt += `컨텐츠:\n${content}\n\n`;

    if (targetKeywords.length > 0) {
        prompt += `타겟 키워드: ${targetKeywords.join(', ')}\n`;
    }

    if (targetAudience) {
        prompt += `타겟 오디언스: ${targetAudience}\n`;
    }

    prompt += `톤: ${tone}\n`;

    if (maxLength) {
        prompt += `최대 길이: ${maxLength}자\n`;
    }

    if (minLength) {
        prompt += `최소 길이: ${minLength}자\n`;
    }

    prompt += `\n최적화된 컨텐츠를 제공해주세요.`;

    return prompt;
}

function generateIdeasPrompt(options) {
    const {
        industry,
        topic,
        keywords,
        contentType,
        count,
        language
    } = options;

    let prompt = `${industry} 산업의 ${topic}에 대한 ${contentType} 컨텐츠 아이디어 ${count}개를 제안해주세요.\n\n`;

    if (keywords.length > 0) {
        prompt += `관련 키워드: ${keywords.join(', ')}\n`;
    }

    prompt += `언어: ${language}\n\n`;
    prompt += `각 아이디어는 제목, 간단한 설명, 예상 조회수, 난이도를 포함해주세요.\n`;
    prompt += `JSON 형식으로 응답해주세요.`;

    return prompt;
}

function generateTranslationPrompt(options) {
    const {
        content,
        targetLanguage,
        sourceLanguage,
        preserveFormatting,
        tone
    } = options;

    let prompt = `다음 ${sourceLanguage} 컨텐츠를 ${targetLanguage}로 번역해주세요:\n\n`;
    prompt += `컨텐츠:\n${content}\n\n`;
    prompt += `톤: ${tone}\n`;

    if (preserveFormatting) {
        prompt += `원본 포맷팅을 유지해주세요.\n`;
    }

    prompt += `\n자연스럽고 정확한 번역을 제공해주세요.`;

    return prompt;
}

function generateSummaryPrompt(options) {
    const {
        content,
        summaryType,
        maxLength,
        includeKeyPoints,
        language
    } = options;

    let prompt = `다음 컨텐츠를 ${summaryType} 형태로 요약해주세요:\n\n`;
    prompt += `컨텐츠:\n${content}\n\n`;
    prompt += `최대 길이: ${maxLength}자\n`;
    prompt += `언어: ${language}\n`;

    if (includeKeyPoints) {
        prompt += `핵심 포인트를 포함해주세요.\n`;
    }

    prompt += `\n명확하고 간결한 요약을 제공해주세요.`;

    return prompt;
}

async function analyzeGeneratedContent(content, options) {
    // 실제로는 더 정교한 분석 로직 구현
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    return {
        wordCount,
        readingTime,
        readabilityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        seoScore: Math.floor(Math.random() * 30) + 70, // 70-100
        sentiment: 'positive',
        extractedKeywords: options.keywords || [],
        topics: [options.type],
        improvements: [
            '제목을 더 매력적으로 만들어보세요',
            '첫 문단을 더 강력하게 작성해보세요'
        ],
        callToAction: '더 자세한 정보를 원하시면 연락주세요',
        seoRecommendations: [
            '메타 설명을 추가하세요',
            '내부 링크를 포함하세요'
        ]
    };
}

async function analyzeOptimizedContent(original, optimized, options) {
    const originalWordCount = original.split(/\s+/).length;
    const optimizedWordCount = optimized.split(/\s+/).length;

    return {
        seoScore: Math.floor(Math.random() * 20) + 80,
        readabilityScore: Math.floor(Math.random() * 15) + 85,
        engagementScore: Math.floor(Math.random() * 25) + 75,
        wordCountChange: optimizedWordCount - originalWordCount,
        keywordDensity: Math.floor(Math.random() * 5) + 2,
        sentimentChange: 'improved',
        suggestions: [
            '더 많은 관련 키워드를 포함하세요',
            '문단을 더 짧게 나누어보세요'
        ]
    };
}

async function generateImageSuggestions(topic, keywords) {
    // 실제로는 이미지 생성 API 호출
    return [
        {
            description: `${topic} 관련 이미지`,
            keywords: keywords,
            style: 'professional',
            suggestedPrompt: `Professional image about ${topic}`
        }
    ];
}

async function performContentAnalysis(content, analysisType) {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const paragraphCount = content.split(/\n\s*\n/).length;

    return {
        wordCount,
        sentenceCount,
        paragraphCount,
        averageWordsPerSentence: Math.round(wordCount / sentenceCount),
        readabilityScore: Math.floor(Math.random() * 40) + 60,
        seoScore: Math.floor(Math.random() * 30) + 70,
        sentiment: 'positive',
        keywords: [],
        topics: [],
        suggestions: []
    };
}

function getMaxTokens(length) {
    const tokenMap = {
        'short': 500,
        'medium': 1000,
        'long': 2000
    };
    return tokenMap[length] || 1000;
}

module.exports = router;

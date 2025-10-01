# Translation System Setup for Community Hub

This document outlines the implementation of a translation system for the Community Hub platform, enabling Korean to English input translation and English to Korean output translation.

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Implementation](#implementation)
- [API Integration](#api-integration)
- [Frontend Integration](#frontend-integration)
- [Backend Integration](#backend-integration)
- [Configuration](#configuration)
- [Testing](#testing)
- [Monitoring](#monitoring)

## Overview

The translation system provides real-time translation capabilities for:
- **Input Translation**: Korean user input → English for processing
- **Output Translation**: English system responses → Korean for display
- **Documentation**: All technical documentation in English
- **Code Comments**: All code comments in English

## System Architecture

### Translation Flow
```
Korean Input → Translation Service → English Processing → English Response → Translation Service → Korean Output
```

### Components
1. **Translation Service**: Handles language detection and translation
2. **Input Processor**: Translates Korean input to English
3. **Output Processor**: Translates English output to Korean
4. **Language Detector**: Automatically detects input language
5. **Cache Layer**: Caches translations for performance

## Implementation

### Translation Service Options

#### Option 1: Google Translate API
```javascript
// services/translation/google-translate.js
import { Translate } from '@google-cloud/translate/build/src/v2';

class GoogleTranslateService {
  constructor() {
    this.translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
    });
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const [translation] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage
      });
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  async detectLanguage(text) {
    try {
      const [detection] = await this.translate.detect(text);
      return detection.language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }
}

export default GoogleTranslateService;
```

#### Option 2: Azure Translator
```javascript
// services/translation/azure-translator.js
import axios from 'axios';

class AzureTranslatorService {
  constructor() {
    this.endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    this.key = process.env.AZURE_TRANSLATOR_KEY;
    this.region = process.env.AZURE_TRANSLATOR_REGION;
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const response = await axios.post(
        `${this.endpoint}/translate?api-version=3.0&from=${sourceLanguage}&to=${targetLanguage}`,
        [{ text }],
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.key,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data[0].translations[0].text;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  async detectLanguage(text) {
    try {
      const response = await axios.post(
        `${this.endpoint}/detect?api-version=3.0`,
        [{ text }],
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.key,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data[0].language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
}

export default AzureTranslatorService;
```

#### Option 3: LibreTranslate (Self-hosted)
```javascript
// services/translation/libre-translate.js
import axios from 'axios';

class LibreTranslateService {
  constructor() {
    this.endpoint = process.env.LIBRE_TRANSLATE_ENDPOINT || 'http://localhost:5000';
    this.apiKey = process.env.LIBRE_TRANSLATE_API_KEY;
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const response = await axios.post(`${this.endpoint}/translate`, {
        q: text,
        source: sourceLanguage || 'auto',
        target: targetLanguage,
        format: 'text',
        api_key: this.apiKey
      });
      return response.data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  async detectLanguage(text) {
    try {
      const response = await axios.post(`${this.endpoint}/detect`, {
        q: text,
        api_key: this.apiKey
      });
      return response.data[0].language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
}

export default LibreTranslateService;
```

### Translation Service Factory
```javascript
// services/translation/translation-factory.js
import GoogleTranslateService from './google-translate.js';
import AzureTranslatorService from './azure-translator.js';
import LibreTranslateService from './libre-translate.js';

class TranslationServiceFactory {
  static createService(provider = 'google') {
    switch (provider) {
      case 'google':
        return new GoogleTranslateService();
      case 'azure':
        return new AzureTranslatorService();
      case 'libre':
        return new LibreTranslateService();
      default:
        throw new Error(`Unsupported translation provider: ${provider}`);
    }
  }
}

export default TranslationServiceFactory;
```

## API Integration

### Translation Middleware
```javascript
// middleware/translation.js
import TranslationServiceFactory from '../services/translation/translation-factory.js';
import { kvSet, kvGet } from '../redis.js';

const translationService = TranslationServiceFactory.createService(process.env.TRANSLATION_PROVIDER);

export const translateInput = async (req, res, next) => {
  try {
    // Check if translation is needed
    if (req.body.content && req.body.content.trim()) {
      const detectedLanguage = await translationService.detectLanguage(req.body.content);
      
      if (detectedLanguage === 'ko') {
        // Check cache first
        const cacheKey = `translation:ko-en:${req.body.content}`;
        let translatedContent = await kvGet(cacheKey);
        
        if (!translatedContent) {
          translatedContent = await translationService.translateText(
            req.body.content,
            'en',
            'ko'
          );
          // Cache for 1 hour
          await kvSet(cacheKey, translatedContent, 3600);
        }
        
        req.body.originalContent = req.body.content;
        req.body.content = translatedContent;
        req.body.translated = true;
        req.body.sourceLanguage = 'ko';
      }
    }
    
    next();
  } catch (error) {
    console.error('Input translation error:', error);
    // Continue without translation if service fails
    next();
  }
};

export const translateOutput = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Only translate if the request was translated
    if (req.body.translated && req.body.sourceLanguage === 'ko') {
      try {
        const responseData = JSON.parse(data);
        
        if (responseData.success && responseData.data) {
          // Translate response data
          translateResponseData(responseData.data, 'ko').then(translatedData => {
            responseData.data = translatedData;
            originalSend.call(this, JSON.stringify(responseData));
          }).catch(error => {
            console.error('Output translation error:', error);
            originalSend.call(this, data);
          });
        } else {
          originalSend.call(this, data);
        }
      } catch (error) {
        console.error('Output translation error:', error);
        originalSend.call(this, data);
      }
    } else {
      originalSend.call(this, data);
    }
  };
  
  next();
};

async function translateResponseData(data, targetLanguage) {
  if (typeof data === 'string') {
    return await translationService.translateText(data, targetLanguage, 'en');
  } else if (Array.isArray(data)) {
    return await Promise.all(data.map(item => translateResponseData(item, targetLanguage)));
  } else if (typeof data === 'object' && data !== null) {
    const translated = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'content' || key === 'title' || key === 'description') {
        translated[key] = await translationService.translateText(value, targetLanguage, 'en');
      } else {
        translated[key] = await translateResponseData(value, targetLanguage);
      }
    }
    return translated;
  }
  return data;
}
```

### Translation Routes
```javascript
// routes/translation.js
import express from 'express';
import TranslationServiceFactory from '../services/translation/translation-factory.js';

const router = express.Router();
const translationService = TranslationServiceFactory.createService(process.env.TRANSLATION_PROVIDER);

// Translate text endpoint
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'Text and target language are required' }
      });
    }
    
    const translatedText = await translationService.translateText(text, targetLanguage, sourceLanguage);
    
    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TRANSLATION_FAILED', message: 'Translation service unavailable' }
    });
  }
});

// Detect language endpoint
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TEXT', message: 'Text is required' }
      });
    }
    
    const detectedLanguage = await translationService.detectLanguage(text);
    
    res.json({
      success: true,
      data: {
        text,
        detectedLanguage
      }
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DETECTION_FAILED', message: 'Language detection service unavailable' }
    });
  }
});

export default router;
```

## Frontend Integration

### Translation Hook
```typescript
// hooks/useTranslation.ts
import { useState, useCallback } from 'react';
import { apiService } from '../api';

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateText = useCallback(async (
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult | null> => {
    if (!text.trim()) return null;

    setIsTranslating(true);
    setError(null);

    try {
      const result = await apiService.translateText(text, targetLanguage, sourceLanguage);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const detectLanguage = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;

    try {
      const result = await apiService.detectLanguage(text);
      return result.data.detectedLanguage;
    } catch (err) {
      console.error('Language detection failed:', err);
      return null;
    }
  }, []);

  return {
    translateText,
    detectLanguage,
    isTranslating,
    error
  };
};
```

### Translation Component
```typescript
// components/TranslationProvider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface TranslationContextType {
  translateInput: (text: string) => Promise<string>;
  translateOutput: (text: string) => Promise<string>;
  isTranslating: boolean;
  error: string | null;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: React.ReactNode;
  userLanguage?: string;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  userLanguage = 'ko'
}) => {
  const { translateText, isTranslating, error } = useTranslation();

  const translateInput = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return text;

    // Detect if input is Korean
    const detectedLanguage = await detectLanguage(text);
    if (detectedLanguage === 'ko') {
      const result = await translateText(text, 'en', 'ko');
      return result?.translatedText || text;
    }

    return text;
  }, [translateText]);

  const translateOutput = useCallback(async (text: string): Promise<string> => {
    if (!text.trim() || userLanguage === 'en') return text;

    const result = await translateText(text, userLanguage, 'en');
    return result?.translatedText || text;
  }, [translateText, userLanguage]);

  const value: TranslationContextType = {
    translateInput,
    translateOutput,
    isTranslating,
    error
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
```

### Auto-Translation Input Component
```typescript
// components/AutoTranslateInput.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslationContext } from './TranslationProvider';

interface AutoTranslateInputProps {
  value: string;
  onChange: (value: string, translatedValue?: string) => void;
  placeholder?: string;
  className?: string;
}

export const AutoTranslateInput: React.FC<AutoTranslateInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className
}) => {
  const { translateInput, isTranslating } = useTranslationContext();
  const [translatedValue, setTranslatedValue] = useState<string>('');

  const handleInputChange = useCallback(async (inputValue: string) => {
    onChange(inputValue);
    
    if (inputValue.trim()) {
      const translated = await translateInput(inputValue);
      setTranslatedValue(translated);
    } else {
      setTranslatedValue('');
    }
  }, [onChange, translateInput]);

  return (
    <div className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        disabled={isTranslating}
      />
      {isTranslating && (
        <div className="translation-indicator">
          Translating...
        </div>
      )}
      {translatedValue && translatedValue !== value && (
        <div className="translation-preview">
          <strong>Translated:</strong> {translatedValue}
        </div>
      )}
    </div>
  );
};
```

## Backend Integration

### Translation Service Registration
```javascript
// server.js
import translationRouter from './routes/translation.js';
import { translateInput, translateOutput } from './middleware/translation.js';

// Register translation routes
app.use('/api/translation', translationRouter);

// Apply translation middleware to relevant routes
app.use('/api/posts', translateInput, translateOutput);
app.use('/api/comments', translateInput, translateOutput);
app.use('/api/search', translateInput, translateOutput);
```

### API Service Integration
```typescript
// api/translation.ts
import { apiService } from './api';

export const translationApi = {
  translateText: async (text: string, targetLanguage: string, sourceLanguage?: string) => {
    return await apiService.post('/api/translation/translate', {
      text,
      targetLanguage,
      sourceLanguage
    });
  },

  detectLanguage: async (text: string) => {
    return await apiService.post('/api/translation/detect', { text });
  }
};
```

## Configuration

### Environment Variables
```env
# Translation Service Configuration
TRANSLATION_PROVIDER=google
TRANSLATION_ENABLED=true

# Google Translate API
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/keyfile.json

# Azure Translator
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
AZURE_TRANSLATOR_KEY=your-azure-key
AZURE_TRANSLATOR_REGION=your-region

# LibreTranslate (Self-hosted)
LIBRE_TRANSLATE_ENDPOINT=http://localhost:5000
LIBRE_TRANSLATE_API_KEY=your-api-key

# Translation Settings
TRANSLATION_CACHE_TTL=3600
TRANSLATION_RATE_LIMIT=1000
```

### Translation Configuration
```javascript
// config/translation.js
export const translationConfig = {
  enabled: process.env.TRANSLATION_ENABLED === 'true',
  provider: process.env.TRANSLATION_PROVIDER || 'google',
  cache: {
    ttl: parseInt(process.env.TRANSLATION_CACHE_TTL) || 3600,
    maxSize: 10000
  },
  rateLimit: {
    max: parseInt(process.env.TRANSLATION_RATE_LIMIT) || 1000,
    window: 3600000 // 1 hour
  },
  supportedLanguages: ['en', 'ko', 'ja', 'zh'],
  defaultSourceLanguage: 'auto',
  defaultTargetLanguage: 'en'
};
```

## Testing

### Translation Service Tests
```javascript
// tests/translation/translation-service.test.js
import TranslationServiceFactory from '../../src/services/translation/translation-factory.js';

describe('Translation Service', () => {
  let translationService;

  beforeEach(() => {
    translationService = TranslationServiceFactory.createService('google');
  });

  describe('translateText', () => {
    it('translates Korean to English', async () => {
      const result = await translationService.translateText('안녕하세요', 'en', 'ko');
      expect(result).toBe('Hello');
    });

    it('translates English to Korean', async () => {
      const result = await translationService.translateText('Hello', 'ko', 'en');
      expect(result).toBe('안녕하세요');
    });

    it('handles empty text', async () => {
      const result = await translationService.translateText('', 'en', 'ko');
      expect(result).toBe('');
    });
  });

  describe('detectLanguage', () => {
    it('detects Korean text', async () => {
      const result = await translationService.detectLanguage('안녕하세요');
      expect(result).toBe('ko');
    });

    it('detects English text', async () => {
      const result = await translationService.detectLanguage('Hello');
      expect(result).toBe('en');
    });
  });
});
```

### Translation Middleware Tests
```javascript
// tests/translation/middleware.test.js
import request from 'supertest';
import express from 'express';
import { translateInput, translateOutput } from '../../src/middleware/translation.js';

const app = express();
app.use(express.json());
app.use(translateInput);
app.use(translateOutput);

app.post('/test', (req, res) => {
  res.json({ success: true, data: { content: req.body.content } });
});

describe('Translation Middleware', () => {
  it('translates Korean input to English', async () => {
    const response = await request(app)
      .post('/test')
      .send({ content: '안녕하세요' })
      .expect(200);

    expect(response.body.data.content).toBe('Hello');
    expect(response.body.data.originalContent).toBe('안녕하세요');
    expect(response.body.data.translated).toBe(true);
  });

  it('does not translate English input', async () => {
    const response = await request(app)
      .post('/test')
      .send({ content: 'Hello' })
      .expect(200);

    expect(response.body.data.content).toBe('Hello');
    expect(response.body.data.translated).toBeFalsy();
  });
});
```

## Monitoring

### Translation Metrics
```javascript
// metrics/translation-metrics.js
import promClient from 'prom-client';

const translationRequests = new promClient.Counter({
  name: 'translation_requests_total',
  help: 'Total number of translation requests',
  labelNames: ['source_language', 'target_language', 'provider']
});

const translationDuration = new promClient.Histogram({
  name: 'translation_duration_seconds',
  help: 'Duration of translation requests in seconds',
  labelNames: ['provider']
});

const translationErrors = new promClient.Counter({
  name: 'translation_errors_total',
  help: 'Total number of translation errors',
  labelNames: ['provider', 'error_type']
});

export { translationRequests, translationDuration, translationErrors };
```

### Translation Service Monitoring
```javascript
// services/translation/monitored-translation-service.js
import TranslationServiceFactory from './translation-factory.js';
import { translationRequests, translationDuration, translationErrors } from '../../metrics/translation-metrics.js';

class MonitoredTranslationService {
  constructor(provider) {
    this.service = TranslationServiceFactory.createService(provider);
    this.provider = provider;
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    const startTime = Date.now();
    
    try {
      translationRequests.inc({
        source_language: sourceLanguage || 'auto',
        target_language: targetLanguage,
        provider: this.provider
      });

      const result = await this.service.translateText(text, targetLanguage, sourceLanguage);
      
      translationDuration.observe(
        { provider: this.provider },
        (Date.now() - startTime) / 1000
      );

      return result;
    } catch (error) {
      translationErrors.inc({
        provider: this.provider,
        error_type: error.constructor.name
      });
      throw error;
    }
  }

  async detectLanguage(text) {
    const startTime = Date.now();
    
    try {
      const result = await this.service.detectLanguage(text);
      
      translationDuration.observe(
        { provider: this.provider },
        (Date.now() - startTime) / 1000
      );

      return result;
    } catch (error) {
      translationErrors.inc({
        provider: this.provider,
        error_type: error.constructor.name
      });
      throw error;
    }
  }
}

export default MonitoredTranslationService;
```

## Usage Examples

### Basic Translation
```javascript
// Translate Korean input to English
const koreanText = '안녕하세요, 반갑습니다!';
const englishText = await translationService.translateText(koreanText, 'en', 'ko');
console.log(englishText); // "Hello, nice to meet you!"

// Translate English output to Korean
const englishResponse = 'Welcome to our community!';
const koreanResponse = await translationService.translateText(englishResponse, 'ko', 'en');
console.log(koreanResponse); // "우리 커뮤니티에 오신 것을 환영합니다!"
```

### Language Detection
```javascript
// Detect language of input text
const detectedLanguage = await translationService.detectLanguage('안녕하세요');
console.log(detectedLanguage); // "ko"

const detectedLanguage2 = await translationService.detectLanguage('Hello');
console.log(detectedLanguage2); // "en"
```

### Frontend Integration
```typescript
// Use translation in React components
const MyComponent = () => {
  const { translateInput, translateOutput } = useTranslationContext();
  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    const translatedInput = await translateInput(input);
    // Process translated input
    console.log('Original:', input);
    console.log('Translated:', translatedInput);
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

---

This translation system provides comprehensive language support for the Community Hub platform, enabling seamless communication between Korean users and the English-based system while maintaining code quality and documentation standards.

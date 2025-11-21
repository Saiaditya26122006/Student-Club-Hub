# Google Gemini AI Setup Guide

ClubHub now uses **Google Gemini AI** instead of OpenAI for all AI-powered features.

## 🔑 Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## ⚙️ Configuration

Add your Gemini API key to your `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📦 Installation

Install the required package:

```bash
cd backend
pip install google-generativeai
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

## ✅ Features Using Gemini AI

The following features now use Google Gemini:

1. **AI Leader Insights** (`/api/ai/leader-insights`)
   - Generates analytics insights for club leaders
   - Provides actionable recommendations

2. **AI Event Recommendations** (`/api/ai/recommend-events`)
   - Personalized event suggestions for participants
   - Based on past interests and preferences

3. **Event Name Suggestions** (`/api/ai/suggest-event`)
   - Creative event title suggestions
   - Based on category and description

## 🚀 Usage

Once configured, the AI features will automatically use Gemini. No code changes needed in your frontend!

## 🔧 Troubleshooting

### Error: "Gemini API key not configured"
- Make sure `GEMINI_API_KEY` is set in your `.env` file
- Restart your Flask server after adding the key

### Error: "google-generativeai not installed"
- Run: `pip install google-generativeai`
- Make sure you're in the backend virtual environment

### Error: "Empty response from Gemini API"
- Check your API key is valid
- Verify you have quota/credits in Google AI Studio
- Check your internet connection

## 📝 Notes

- Gemini Pro model is used by default
- Temperature is set to 0.7 for balanced creativity
- Max output tokens vary by endpoint (100-800)
- All AI responses are parsed for JSON when needed

## 🔄 Migration from OpenAI

If you were previously using OpenAI:
1. Remove `OPENAI_API_KEY` from `.env` (if present)
2. Add `GEMINI_API_KEY` to `.env`
3. Install `google-generativeai` package
4. Restart your backend server

No frontend changes required!


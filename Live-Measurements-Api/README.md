---
title: Youngin AI Backend
emoji: 👕
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
license: mit
---

# Youngin AI Backend

AI-powered body measurement and chatbot API for custom clothing design.

## Features

- **AI Sizing**: Computer vision-based body measurements using MediaPipe and MiDaS
- **Chatbot**: Gemini-powered fashion assistant
- **CORS Enabled**: Ready for frontend integration

## API Endpoints

- `GET /health` - Health check
- `POST /measurements` - Body measurement analysis
- `POST /chat` - Chatbot interaction

## Environment Variables

Set these in your Space settings:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `ALLOWED_ORIGINS` - CORS allowed origins (default: *)

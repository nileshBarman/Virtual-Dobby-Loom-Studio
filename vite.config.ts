import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

function geminiAssistantPlugin(): Plugin {
  return {
    name: 'gemini-assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/assistant', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { prompt, context } = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'API key not configured' }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const systemInstruction = `You are an expert handloom textile technologist and master dobby weaving designer. You advise handloom weavers, students, and textile designers on dobby drafting plans, lifting sequences, yarn counts (e.g. 20/22D silk, 2/80s cotton, tested zari), EPI/PPI reed denting, float prevention, and traditional Indian handloom borders (Maheshwari, Chanderi, Kanjivaram, Jamdani). Keep explanations technical, precise, concise, and structured.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: [
                  {
                    text: `Current Active Design Context: ${JSON.stringify(context)}\n\nUser Question: ${prompt}`,
                  },
                ],
                config: {
                  systemInstruction,
                },
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply: response.text }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Generation error' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiAssistantPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});


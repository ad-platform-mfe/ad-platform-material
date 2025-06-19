import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 处理微应用环境
function handleMicroApp(): Plugin {
  let isMicro = false
  return {
    name: 'micro-app-config',
    enforce: 'pre',
    configResolved(config: ResolvedConfig) {
      isMicro = config.mode === 'development'
    },
    transformIndexHtml(html: string) {
      if (isMicro) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              injectTo: 'body-prepend',
              children: `window.__MICRO_APP_ENVIRONMENT__ = true`
            }
          ]
        }
      }
      return html
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), handleMicroApp()],
  server: {
    port: 5176,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})

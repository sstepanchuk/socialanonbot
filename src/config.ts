interface ProcessEnv {
  DATABASE_URL: string
  TELEGRAM_TOKEN: string
  IG_USERNAME: string
  IG_PASSWORD: string
}

export const ENV = process.env as unknown as ProcessEnv

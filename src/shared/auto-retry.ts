export interface AutoRetryOptions {
  maxRetries?: number
  delayMs?: number
}

export async function autoRetryAsync<T> (
  func: () => Promise<T>,
  tag: string,
  options: AutoRetryOptions
): Promise<T | undefined> {
  const {
    maxRetries = 3,
    delayMs = 1000
  } = options

  let retries = 0
  while (retries <= maxRetries) {
    try {
      return await func().then((res) => {
        if (retries > 0) { console.log(`[Attempt ${retries + 1} succeeded]`) }
        return res
      })
    } catch (error) {
      console.error(`[${tag}] Attempt ${retries + 1} failed with error: ${error}`)
      retries++
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  console.error(`[${tag}] Function failed after ${maxRetries} attempts.`)
}

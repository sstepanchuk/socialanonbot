import TelegramBot, { type Message } from 'node-telegram-bot-api'
import { type IProvider } from './IProvider'
import { ENV } from '../config'

export class TelegramProvider implements IProvider {
  private readonly client = new TelegramBot(ENV.TELEGRAM_TOKEN, { polling: true })

  private tgCallback (callback: (data: { clientid: string, message: string }) => Promise<void>): (msg: Message) => Promise<void> {
    return async (msg: Message): Promise<void> => {
      if (msg.text != null) { await callback({ clientid: msg.chat.id.toString(), message: msg.text }) }
    }
  }

  async sendMessage (clientid: string, message: string): Promise<void> {
    await this.client.sendMessage(clientid, message)
  }

  registerMessageCallback (callback: (data: { clientid: string, message: string }) => Promise<void>): { removeListener: () => void } {
    const listener = this.tgCallback(callback)
    this.client.on('message', listener)
    return {
      removeListener: () => this.client.removeListener('message', listener)
    }
  }

  async init (): Promise<void> {
    // Do nothing
  }
}

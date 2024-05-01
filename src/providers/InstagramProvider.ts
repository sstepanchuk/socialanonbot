import { type IProvider } from './IProvider'
import { ENV } from '../config'
import {
  type AccountRepositoryLoginResponseLogged_in_user,
  IgApiClient
} from 'instagram-private-api'
import fs from 'fs'

export class InstagramProvider implements IProvider {
  private readonly client = new IgApiClient()
  private user: AccountRepositoryLoginResponseLogged_in_user | null = null

  private readonly dataFilePath: string = './instagramlog.json'

  private loadData (): Record<string, string[]> {
    try {
      const data = fs.readFileSync(this.dataFilePath, 'utf-8')
      return JSON.parse(data) as Record<string, string[]>
    } catch (error) {
      return {}
    }
  }

  private saveData (val: Record<string, string[]>): void {
    try {
      const data = JSON.stringify(val, null, 2)
      fs.writeFileSync(this.dataFilePath, data, 'utf-8')
    } catch (error) {
      // Handle error if file cannot be written
      console.error('Failed to save data:', error)
    }
  }

  get readedItems (): Record<string, string[]> {
    return this.loadData()
  }

  set readedItems (value: Record<string, string[]>) {
    this.saveData(value)
  }

  async init (): Promise<void> {
    this.client.state.generateDevice(ENV.IG_USERNAME)
    await this.client.simulate.preLoginFlow()
    this.user = await this.client.account.login(
      ENV.IG_USERNAME,
      ENV.IG_PASSWORD
    )
  }

  async sendMessage (clientid: string, message: string): Promise<void> {
    try {
      await this.client.entity.directThread(clientid).broadcastText(message)
    } catch (error) {
      console.error('INSTAGRAM: Failed to send message:', error)
    }
  }

  registerMessageCallback (
    callback: (data: { clientid: string, message: string }) => Promise<void>
  ): { removeListener: () => void } {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const interval = setInterval(async () => {
      try {
        const directPending = await this.client.feed.directPending().items()
        for (const thread of directPending) {
          await this.client.directThread.approve(thread.thread_id)
        }

        const readedItems = this.readedItems

        const data = await this.client.feed.directInbox().items()
        for (const thread of data) {
          for (const item of thread.items) {
            if (item.user_id === this.user?.pk) continue
            if (readedItems[thread.thread_id] !== undefined) {
              if (readedItems[thread.thread_id].includes(item.item_id)) {
                continue
              }
            }
            if (item.text != null) {
              void callback({ clientid: thread.thread_id, message: item.text })
            }
            if (readedItems[thread.thread_id] === undefined) {
              readedItems[thread.thread_id] = []
            }
            readedItems[thread.thread_id].push(item.item_id)
            readedItems[thread.thread_id] =
              readedItems[thread.thread_id].slice(-10)
          }
        }
        this.readedItems = readedItems
      } catch (error) {
        console.error('INSTAGRAM: Failed to get direct inbox:', error)
      }
    }, 7000)

    return {
      removeListener: () => {
        clearInterval(interval)
      }
    }
  }
}

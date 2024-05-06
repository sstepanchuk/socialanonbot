import { type IProvider } from './IProvider'
import { ENV } from '../config'
import {
  type AccountRepositoryLoginResponseLogged_in_user,
  IgApiClient,
  type DirectInboxFeedResponseItemsItem
} from 'instagram-private-api'
import { autoRetryAsync } from '../shared/auto-retry'
import prisma from '../prisma'

export class InstagramProvider implements IProvider {
  private readonly client = new IgApiClient()
  private user: AccountRepositoryLoginResponseLogged_in_user | null = null

  async pushLog(threadId: string, itemId: string): Promise<void> {
    await prisma.instagramLog.create({
      data: {
        threadId,
        itemId
      }
    })
  }

  async ifLogExists(threadId: string, itemId: string): Promise<boolean> {
    const log = await prisma.instagramLog.count({
      where: {
        threadId,
        itemId
      }
    })
    return log > 0
  }

  async init (): Promise<void> {
    this.client.state.generateDevice(ENV.IG_USERNAME)
    await autoRetryAsync(async () => { await this.client.simulate.preLoginFlow() },
      'InstagramProvider.init',
      { maxRetries: 0, delayMs: 5 * 60 * 1000 }
    )

    await autoRetryAsync(async () => {
      this.user = await this.client.account.login(
        ENV.IG_USERNAME,
        ENV.IG_PASSWORD
      )
    },
    'InstagramProvider.init',
    { maxRetries: 0, delayMs: 5 * 60 * 1000 }
    )
  }

  async sendMessage (clientid: string, message: string): Promise<void> {
    await autoRetryAsync(
      async () => await this.client.entity.directThread(clientid).broadcastText(message),
      'InstagramProvider.sendMessage',
      { maxRetries: 3, delayMs: 1000 }
    )
  }

  registerMessageCallback (
    callback: (data: { clientid: string, message: string }) => Promise<void>
  ): { removeListener: () => void } {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const workWithThred = async (threadId: string, notSortedItems: DirectInboxFeedResponseItemsItem[]): Promise<void> => {
      const items = notSortedItems.sort((a, b) => +a.timestamp - +b.timestamp)
      for (const item of items) {
        if (item.user_id === this.user?.pk) continue
        if (await this.ifLogExists(threadId, item.item_id)) {
          continue
        }
        if (item.text != null) {
          await callback({ clientid: threadId, message: item.text })
        }
        await this.pushLog(threadId, item.item_id)
      }
    }

    const interval = setInterval(async () => {
      try {
        const directPending = await this.client.feed.directPending().items()
        for (const thread of directPending) {
          await this.client.directThread.approve(thread.thread_id)
        }

        const data = await this.client.feed.directInbox().items()

        for (const thread of data) {
          void workWithThred(thread.thread_id, thread.items)
        }
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

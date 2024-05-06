import { TelegramProvider } from './providers/TelegramProvider'
import { InstagramProvider } from './providers/InstagramProvider'
import { type IProvider, ProviderType } from './providers/IProvider'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const providers: Record<ProviderType, IProvider> = {
  [ProviderType.Telegram]: new TelegramProvider(),
  [ProviderType.Instagram]: new InstagramProvider()
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
setInterval(async () => {
  const queues = await prisma.$queryRawUnsafe<Array<{
    providerType1: ProviderType
    clientId1: string
    providerType2: ProviderType
    clientId2: string
  }>>(`
    SELECT q1.providerType as providerType1, q1.clientId as clientId1,
      q2.providerType as providerType2, q2.clientId as clientId2
      FROM "Queue" AS q1
    CROSS JOIN "Queue" AS q2
    WHERE NOT EXISTS (
          SELECT 1
          FROM "Chat" AS c
          WHERE (
              (c."clientId1" = q1."clientId" AND c."providerType1" = q1."providerType" 
              AND c."clientId2" = q2."clientId" AND c."providerType2" = q2."providerType")
              OR
              (c."clientId1" = q2."clientId" AND c."providerType1" = q2."providerType" 
              AND c."clientId2" = q1."clientId" AND c."providerType2" = q1."providerType")
          )
    ) AND (q1.providerType <> q2.providerType OR q1.clientId <> q2.clientId) AND 
    q1.providerType IS NOT NULL AND q1.clientId IS NOT NULL AND q2.providerType IS NOT NULL AND q2.clientId IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1;`)

  if (queues.length === 0) return

  await prisma.chat.create({
    data: {
      providerType1: queues[0].providerType1,
      clientId1: queues[0].clientId1,
      providerType2: queues[0].providerType2,
      clientId2: queues[0].clientId2
    }
  })

  await prisma.queue.deleteMany({
    where: {
      OR: [
        { clientId: queues[0].clientId1, providerType: queues[0].providerType1 },
        { clientId: queues[0].clientId2, providerType: queues[0].providerType2 }
      ]
    }
  })

  await providers[queues[0].providerType1].sendMessage(queues[0].clientId1, 'We found a partner for you. Say hi!')
  await providers[queues[0].providerType2].sendMessage(queues[0].clientId2, 'We found a partner for you. Say hi!')
}, 1000)

async function putInQueue (provider: ProviderType, clientid: string): Promise<void> {
  const queue = await prisma.queue.findFirst({
    where: {
      providerType: provider.toString(),
      clientId: clientid
    }
  })
  if (queue == null) {
    await prisma.queue.create({
      data: {
        providerType: provider.toString(),
        clientId: clientid
      }
    })
    void providers[provider].sendMessage(clientid, 'We put you in the queue.')
  } else void providers[provider].sendMessage(clientid, 'You are already in the queue.')
}

async function listener (provider: ProviderType, clientid: string, message: string): Promise<void> {
  const chat = await prisma.chat.findFirst({
    where: {
      AND: [
        {
          OR: [
            { clientId1: clientid, providerType1: provider.toString() },
            { clientId2: clientid, providerType2: provider.toString() }
          ]
        },
        {
          closedAt: null
        }
      ]
    }
  })

  if (chat == null) {
    await putInQueue(provider, clientid)
    return
  } else if (message === '/next') {
    await prisma.chat.updateMany({
      where: {
        providerType1: chat.providerType1,
        clientId1: chat.clientId1,
        providerType2: chat.providerType2,
        clientId2: chat.clientId2
      },
      data: {
        closedAt: new Date()
      }
    })

    void providers[chat.providerType1 as ProviderType].sendMessage(chat.clientId1, 'Your partner left the chat.').then(() => {
      void putInQueue(chat.providerType1 as ProviderType, chat.clientId1)
    })

    void providers[chat.providerType2 as ProviderType].sendMessage(chat.clientId2, 'Your partner left the chat.').then(() => {
      void putInQueue(chat.providerType2 as ProviderType, chat.clientId2)
    })
  }

  const id = chat.clientId1 === clientid ? 2 : 1
  const sendProviderType = chat[`providerType${id}`]
  const sendClientId = chat[`clientId${id}`]

  providers[sendProviderType].sendMessage(sendClientId, message)
}

async function main (): Promise<void> {
  for (const [providerType, provider] of Object.entries(providers)) {
    await provider.init()
    console.log(`${providerType} provider initialized`)
    provider.registerMessageCallback(async ({ clientid, message }) => {
      await listener(providerType as ProviderType, clientid, message)
    })
    console.log(`${providerType} provider registered message callback`)
  }
}

void main()

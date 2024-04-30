export interface IProvider {
  sendMessage: (clientid: string, message: string) => Promise<void>
  registerMessageCallback: (callback: (data: { clientid: string, message: string }) => Promise<void>) => { removeListener: () => void }
  init: () => Promise<void>
}

export enum ProviderType {
  Telegram = 'Telegram',
  Instagram = 'Instagram'
}

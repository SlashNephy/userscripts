import type { AnswerResultsEvent } from './amq'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    detailedSongInfo?: {
      get rows(): CustomRow[]
      get links(): CustomLink[]
      register(item: CustomRow | CustomLink): void
      unregister(item: CustomRow | CustomLink): void
    }
  }
}

export type CustomRow = {
  readonly id: string
  readonly title: string
  isEnabled?(): boolean
  content(event: AnswerResultsEvent): string | null | Promise<string | null>
}

export type CustomLink = {
  readonly id: string
  readonly title: string
  readonly target?: string
  isEnabled?(): boolean
  href(event: AnswerResultsEvent): string | null
}

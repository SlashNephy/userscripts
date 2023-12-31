import { writeFile } from 'fs/promises'

import markdown, { MarkdownTableBuilder } from 'markdown-doc-builder'

import { banners } from '../rollup.config'

const filenames = {
  en: 'README.md',
  ja: 'README.ja.md',
}

const localizedStrings = {
  localizedMarkdown: {
    en: `🇯🇵 日本語版の README は [こちら](https://github.com/SlashNephy/userscripts/blob/master/${filenames.ja}) です。`,
    ja: `🇺🇸 Click [here](https://github.com/SlashNephy/userscripts/blob/master/${filenames.en}) for the English version of README.`,
  },
  install: {
    en: '📥 Install',
    ja: '📥 インストール',
  },
  source: {
    en: '💻 Source',
    ja: '💻 ソースコード',
  },
  article: {
    en: '📖 Scrapbox',
    ja: '📖 Scrapbox',
  },
  script: {
    en: '⚙ Script',
    ja: '⚙ スクリプト',
  },
  version: {
    en: 'Latest Version',
    ja: 'バージョン',
  },
} as const

const generate = async (language: 'en' | 'ja') => {
  const md = markdown.newBuilder()

  md.headerOrdered(false)
  md.h1('userscripts')
  md.newline()

  md.text(localizedStrings.localizedMarkdown[language])
  md.newline()
  md.newline()

  md.text('UserScript collection')
  md.newline()
  md.newline()

  md.h2('UserScript')
  md.newline()

  const table = MarkdownTableBuilder.newBuilder(0, 2)

  table.header([
    localizedStrings.script[language],
    localizedStrings.version[language],
    localizedStrings.install[language],
  ])

  for (const banner of banners.toSorted((a, b) => a.id.localeCompare(b.id))) {
    table.appendRow([
      typeof banner.name === 'string' ? banner.name : banner.name[language] ?? '',
      banner.version,
      `https://github.com/SlashNephy/userscripts/raw/master/dist/${banner.id}.user.js`,
    ])
  }
  md.table(table)

  for (const banner of banners) {
    const name = typeof banner.name === 'string' ? banner.name : banner.name[language] ?? ''
    md.h3(`${name} (v${banner.version})`)

    md.newline()

    md.link(
      `https://github.com/SlashNephy/userscripts/raw/master/dist/${banner.id}.user.js`,
      localizedStrings.install[language]
    )
    md.text(' / ')
    md.link(
      `https://github.com/SlashNephy/userscripts/blob/master/src/${banner.id}.ts`,
      localizedStrings.source[language]
    )

    if (banner.homepage !== undefined) {
      md.text(' / ')
      md.link(banner.homepage, localizedStrings.article[language])
    }

    md.newline()
    md.newline()

    if (typeof banner.description === 'string') {
      md.text(banner.description)
    } else {
      md.text(banner.description[language] ?? '')
    }

    md.newline()
    md.newline()
  }

  const content = md.toMarkdown().trim()
  console.info(content)
  await writeFile(filenames[language], content)
}

Promise.all([generate('en'), generate('ja')]).catch(console.error)

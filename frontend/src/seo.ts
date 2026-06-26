const SITE_ORIGIN = 'https://jsutong.cn'
const DEFAULT_IMAGE = `${SITE_ORIGIN}/social-preview.png`

type SeoOptions = {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: string
}

function absoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString()
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

export function setPageSeo({ title, description, path, keywords = [], image = DEFAULT_IMAGE }: SeoOptions) {
  const url = absoluteUrl(path)

  document.title = title
  upsertCanonical(url)
  upsertMeta('name', 'description', description)

  if (keywords.length > 0) {
    upsertMeta('name', 'keywords', keywords.join(', '))
  }

  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:image:secure_url', image)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)
}

export { SITE_ORIGIN }

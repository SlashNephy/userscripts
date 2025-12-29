const anchor = document.querySelector<HTMLAnchorElement>('body > div > a')
if (anchor) {
  window.location.href = anchor.href
}

// robots.txt with the absolute sitemap URL, which is why it isn't a static
// file in public/: the site URL comes from NUXT_PUBLIC_SITE_URL
// (nuxt-site-config), else the request origin.
export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return buildRobotsTxt(getSiteConfig(event).url ?? '')
})

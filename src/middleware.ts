import { defineMiddleware } from 'astro:middleware';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // www → apex redirect (configure YOUR_DOMAIN below)
  // if (url.hostname === 'www.yourdomain.com') {
  //   return new Response(null, {
  //     status: 301,
  //     headers: { Location: `https://yourdomain.com${url.pathname}${url.search}` },
  //   });
  // }

  const response = await next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});

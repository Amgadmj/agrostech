/**
 * Serves the levantamento page at agrostech.xyz/levantamento while everything else on the
 * apex keeps hitting Lovable.
 *
 * Bind this Worker to the route:  agrostech.xyz/levantamento*
 *
 * Why a Worker and not a redirect: the page must stay ON agrostech.xyz for the
 * domain to be worth using at all. A redirect would bounce visitors to a
 * pages.dev URL and give up the domain.
 */

// Point this at wherever the page is actually hosted. It is currently deployed to
// Vercel, so use that project's URL; a Cloudflare Pages URL works identically.
const ORIGIN = 'https://agrostech-levantamento.vercel.app';
const PREFIX = '/levantamento';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // /levantamento -> /levantamento/  so that relative asset paths in the HTML resolve
    // under the prefix instead of landing on the apex and 404ing against Lovable.
    if (url.pathname === PREFIX) {
      url.pathname = PREFIX + '/';
      return Response.redirect(url.toString(), 308);
    }

    const path = url.pathname.slice(PREFIX.length) || '/';
    const target = new URL(path + url.search, ORIGIN);

    // Range headers must survive: the hero video is seekable and Pages answers 206.
    const upstream = new Request(target, request);
    const response = await fetch(upstream);

    // Copy through, but make the body streamable so large video ranges are not buffered.
    const headers = new Headers(response.headers);
    headers.set('X-Served-By', 'agrostech-levantamento');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

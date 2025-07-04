export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/upload' && request.method === 'POST') {
      const { image } = await request.json();
      const base = image.split(',')[1];
      const bytes = Uint8Array.from(atob(base), c => c.charCodeAt(0));
      const key = `sprite-${Date.now()}.png`;
      await env.SPRITE_BUCKET.put(key, bytes, { contentType: 'image/png' });
      let downloadUrl = null;
      if (typeof env.SPRITE_BUCKET.getSignedUrl === 'function') {
        downloadUrl = await env.SPRITE_BUCKET.getSignedUrl(key, {
          method: 'GET',
          expires: 60 * 60
        });
      }
      return new Response(JSON.stringify({ key, url: downloadUrl }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (url.pathname === '/export' && request.method === 'POST') {
      const body = await request.json();
      const key = `export-${Date.now()}.png`;
      await env.SPRITE_BUCKET.put(key, body.data, { contentType: 'image/png' });
      let urlSigned = null;
      if (env.SPRITE_BUCKET.getSignedUrl) {
        urlSigned = await env.SPRITE_BUCKET.getSignedUrl(key, {
          method: 'GET',
          expires: 60 * 60
        });
      }
      return new Response(JSON.stringify({ key, url: urlSigned }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

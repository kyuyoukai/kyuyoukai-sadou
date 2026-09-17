export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${url.origin}/api/auth`;

    if (!clientId || !clientSecret) {
      return new Response("Authentication is not configured.", { status: 500 });
    }

    if (!code) {
      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", clientId);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      return Response.redirect(authorizeUrl, 302);
    }

    // GitHubへアクセストークンを要求する
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Cloudflare-Pages-Auth"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const text = await tokenResponse.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return new Response(`Parse Error: Not JSON. Response was: ${text}`, { status: 500 });
    }

    if (data.error) {
      return new Response(`GitHub Error: ${data.error_description || data.error}`, { status: 400 });
    }

    const accessToken = data.access_token;
    if (!accessToken) {
      return new Response("Error: No access token found in response.", { status: 500 });
    }

    const tokenJson = JSON.stringify(accessToken);
    const html = `
      <!doctype html>
      <html>
      <body>
        <script>
          const token = ${tokenJson};
          if (window.opener) {
            window.opener.postMessage(
              'authorization:github:success:' + JSON.stringify({ token: token, provider: "github" }),
              ${JSON.stringify(url.origin)}
            );
          }
          window.close();
        </script>
        <p>認証に成功しました。ウィンドウを閉じます...</p>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });

  } catch (err) {
    return new Response(`Exception: ${err.message}`, { status: 500 });
  }
}

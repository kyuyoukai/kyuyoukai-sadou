export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    const clientId = env.GITHUB_CLIENT_ID || env.OAUTH_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET || env.OAUTH_CLIENT_SECRET;

    if (!code) {
      if (!clientId) {
        return new Response("Error: GITHUB_CLIENT_ID is missing.");
      }
      return Response.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`, 302);
    }

    if (!clientId || !clientSecret) {
      return new Response("Error: Client ID or Secret is missing.");
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "json",
        "user-agent": "cloudflare-pages-decap-cms-auth"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`GitHub Error: ${tokenData.error_description || tokenData.error}`);
    }

    const token = tokenData.access_token;
    if (!token) {
      return new Response("Error: Failed to obtain access token from GitHub.");
    }

    const body = `
      <!doctype html>
      <html>
      <body>
        <script>
          const token = "${token}";
          window.opener.postMessage('authorization:github:success:' + JSON.stringify({ token: token, provider: "github" }), "*");
          window.close();
        </script>
        <p>認証成功しました。ウィンドウを閉じます...</p>
      </body>
      </html>
    `;

    return new Response(body, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });

  } catch (err) {
    return new Response(`Server Exception: ${err.message}`, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // 1. 認証コードがない場合は、GitHubの認可画面へリダイレクトする
  if (!code) {
    const clientId = env.GITHUB_CLIENT_ID || env.OAUTH_CLIENT_ID;
    if (!clientId) {
      return new Response("GitHub Client ID is not configured in environment variables.");
    }
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}`;
    return Response.redirect(githubAuthUrl, 302);
  }

  // 2. 認証コードがある場合は、GitHubにアクセストークンを要求する
  const clientId = env.GITHUB_CLIENT_ID || env.OAUTH_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET || env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response("GitHub Client ID or Secret is missing in environment variables");
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
    return new Response(`Error from GitHub: ${tokenData.error_description || tokenData.error}`);
  }

  const token = tokenData.access_token;

  // 3. 取得したトークンをDecap CMSに渡すHTMLを返す
  const body = `
    <!doctype html>
    <html>
    <body>
      <script>
        const receiveMessage = (message) => {
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify({ token: "${token}", provider: "github" }),
            message.origin
          );
        };
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage('authorization:github:success:' + JSON.stringify({ token: "${token}", provider: "github" }), "*");
        setTimeout(() => { window.close(); }, 1000);
      </script>
      <p>認証に成功しました。このウィンドウはまもなく閉じます...</p>
    </body>
    </html>
  `;

  return new Response(body, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
}

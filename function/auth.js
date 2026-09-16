export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const clientId = env.OAUTH_CLIENT_ID;
  const clientSecret = env.OAUTH_CLIENT_SECRET;

  if (!code) {
    // GitHubの認証画面へリダイレクト
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
    return Response.redirect(githubAuthUrl, 302);
  }

  // 認証コードをアクセストークンに交換
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    })
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // CMS側へトークンを返すHTMLスクリプト
  const script = `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          "authorization:github:success:${JSON.stringify({ token: accessToken, provider: "github" })}",
          "*"
        );
        window.close();
      }
      window.onload = () => { receiveMessage(); };
    </script>
  `;

  return new Response(script, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}

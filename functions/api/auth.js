export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    // ★ここに直接書き込みます
    const clientId = "ここにClient_IDを入れる";
    const clientSecret = "ここに新しいClient_Secretを入れる";

    if (!code) {
      return Response.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`, 302);
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

    // GitHubからの生レスポンスのテキストを確認するため、一度テキストとして受け取る
    const responseText = await tokenResponse.text();

    // もしJSONではなくエラー文字列なら、そのまま画面に表示して原因を探る
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      return new Response(`GitHub Raw Response Error: ${responseText}`);
    }

    if (tokenData.error) {
      return new Response(`GitHub OAuth Error: ${tokenData.error_description || tokenData.error}`);
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

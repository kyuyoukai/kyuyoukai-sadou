export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    // テスト用のハードコード（必要に応じて維持）
    const clientId = "Ov23liKW8oXeJWBOQ4wG";
    const clientSecret = "62a6334dd828ef937fc81a58500c3100561431e1";

    if (!code) {
      return Response.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`, 302);
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

    const html = `
      <!doctype html>
      <html>
      <body>
        <script>
          const token = "${accessToken}";
          window.opener.postMessage('authorization:github:success:' + JSON.stringify({ token: token, provider: "github" }), "*");
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

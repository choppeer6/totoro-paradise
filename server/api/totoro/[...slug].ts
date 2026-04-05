export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Host: 'app.xtotoro.com',
    Connection: 'keep-alive',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'TotoroSchool/1.2.14 (iPhone; iOS 17.4.1; Scale/3.00)',
    Cookie: event.node.req.headers.cookie,
    Accept: 'application/json',
  };

  // 调试：记录路径信息
  console.log('[totoro proxy] event.path:', event.path);
  console.log('[totoro proxy] params.slug:', event.context.params?.slug);

  const path = event.path.replace('/api/totoro/', '/app/');
  const targetUrl = `https://app.xtotoro.com${path}`;
  console.log('[totoro proxy] targetUrl:', targetUrl);

  return fetch(targetUrl, {
    method: 'post',
    headers: { ...(headers as HeadersInit) },
    body,
  });
});

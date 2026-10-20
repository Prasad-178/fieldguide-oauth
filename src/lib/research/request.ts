export class RequestTooLarge extends Error {}

/** Bound bytes while reading, including requests without Content-Length. */
export async function readLimitedText(request: Request, maximum: number) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maximum) throw new RequestTooLarge();
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new RequestTooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

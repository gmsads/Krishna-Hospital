export async function sendWithRetry(adapter, request, attempts = 3) {
  let response = await adapter.send(request);
  for (let attempt = 1; attempt < attempts && !response.success && response.retryable; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    response = await adapter.send(request);
  }
  return response;
}

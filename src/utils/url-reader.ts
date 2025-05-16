export function URLReader(
  url: string,
  narrowSearch = false,
  watchParams = ["audio", "nocache"],
) {
  const params = new URLSearchParams(url);

  const results: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    if (narrowSearch) {
      if (watchParams.includes(key)) {
        results[key] = value;
      }
    } else {
      results[key] = value;
    }
  }

  return results;
}

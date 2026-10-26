"use client";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/game/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(
      "Connexion au grenier interrompue. Vérifiez votre connexion, puis réessayez.",
      503,
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "Le serveur n’a pas répondu correctement. Réessayez dans un instant.",
      502,
    );
  }
  if (!response.ok)
    throw new ApiError(
      data.error || "Impossible de joindre le grenier.",
      response.status,
    );
  return data;
}
export async function shareLink(
  url: string,
  title = "Ma chambre — Le Grenier",
) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "Lien partagé.";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError")
        return "Partage annulé.";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Lien copié !";
  } catch {
    throw new Error(`Copiez ce lien : ${url}`);
  }
}

"use client";
export async function exportRoom(id: string) {
  const source = document.getElementById(id);
  if (!source) throw new Error("La chambre n’est pas encore affichée.");
  const clone = source.cloneNode(true) as SVGElement;
  clone.setAttribute("width", "1800");
  clone.setAttribute("height", "1120");
  clone.querySelectorAll(".room-slot").forEach((el) => el.remove());
  for (const img of clone.querySelectorAll("image")) {
    const response = await fetch(img.getAttribute("href")!);
    if (!response.ok)
      throw new Error("Une illustration n’a pas pu être chargée.");
    const text = await response.text();
    img.setAttribute(
      "href",
      `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`,
    );
  }
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 1120;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error(
        "Votre navigateur ne permet pas l’export. Utilisez une capture d’écran.",
      );
    ctx.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b
            ? resolve(b)
            : reject(
                new Error("Export impossible. Utilisez une capture d’écran."),
              ),
        "image/png",
      ),
    );
    const href = URL.createObjectURL(png);
    const link = document.createElement("a");
    link.href = href;
    link.download = "ma-chambre-le-grenier.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

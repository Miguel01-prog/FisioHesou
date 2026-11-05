export function formatDateDDMMYYYY(isoDate) {
  if (!isoDate) return "";
  if (/\d{4}-\d{2}-\d{2}/.test(isoDate)) {
    const [year, month, day] = isoDate.substring(0, 10).split("-");
    return `${day}/${month}/${year}`;
  }
  const match = isoDate.match(/(\d{2})T.*\/(\d{2})\/(\d{4})/);

  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(isoDate);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const year = parsed.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  return isoDate;
}


export function getUsuarioRol(user) {
    if (user?.rol === "fisioterapeuta") return "fisioterapia";
    if (user?.rol === "nutriologa") return "nutricion";
    return user?.rol || null;
};

export function toLocalISODate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

export function capitalizeWords(text = "") {
  if (!text || typeof text !== "string") return "";
  return text
    .split(/\s+/)
    .map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function obfuscateId(id) {
  return id ? String(id) : "";
}

export function deobfuscateId(encoded) {
  return encoded ? String(encoded) : "";
}

export function isHourPassed(hourStr, isoDate) {
  if (!hourStr || !isoDate) return false;
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");
  const hoyStr = `${year}-${month}-${day}`;

  if (isoDate < hoyStr) return true;
  if (isoDate > hoyStr) return false;

  const [hNum, mNum] = hourStr.split(":").map(Number);
  if (isNaN(hNum)) return false;
  const horaCita = new Date(ahora);
  horaCita.setHours(hNum, mNum || 0, 0, 0);

  return horaCita <= ahora;
}

export function resolveImageUrl(imagenUrl) {
  if (!imagenUrl || typeof imagenUrl !== "string") return "";
  const trimmed = imagenUrl.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
  const backendOrigin = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return `${backendOrigin}${cleanPath}`;
}

export function compressImageToBase64(file, maxWidth = 600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

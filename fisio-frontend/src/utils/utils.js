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
    const rawRole = user?.rol || user?.role || null;
    if (rawRole === "fisioterapeuta" || rawRole === "fisioterapia") return "fisioterapia";
    if (rawRole === "nutriologa" || rawRole === "nutricion" || rawRole === "nutriología") return "nutricion";
    return rawRole;
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

export function saveExerciseImageCache(ejercicioOrName, base64DataUrl) {
  if (!base64DataUrl || typeof window === "undefined") return;
  try {
    if (typeof ejercicioOrName === "string") {
      const cleanName = ejercicioOrName.trim().toLowerCase();
      if (cleanName) localStorage.setItem(`hesou_ej_name_${cleanName}`, base64DataUrl);
      return;
    }
    if (ejercicioOrName?._id) {
      localStorage.setItem(`hesou_ej_id_${ejercicioOrName._id}`, base64DataUrl);
    }
    if (ejercicioOrName?.nombre) {
      const cleanName = ejercicioOrName.nombre.trim().toLowerCase();
      if (cleanName) localStorage.setItem(`hesou_ej_name_${cleanName}`, base64DataUrl);
    }
  } catch (e) {
    console.warn("No se pudo guardar la imagen en caché local:", e);
  }
}

export function getExerciseImageCache(ejercicio) {
  if (!ejercicio || typeof window === "undefined") return "";
  try {
    if (ejercicio._id) {
      const byId = localStorage.getItem(`hesou_ej_id_${ejercicio._id}`);
      if (byId) return byId;
    }
    if (ejercicio.nombre) {
      const cleanName = ejercicio.nombre.trim().toLowerCase();
      const byName = localStorage.getItem(`hesou_ej_name_${cleanName}`);
      if (byName) return byName;
    }
  } catch (e) {
    // ignore storage errors
  }
  return "";
}

export function resolveExerciseImage(ejercicio) {
  if (!ejercicio) return "";
  const raw = ejercicio.imagenBase64 || ejercicio.imagenUrl || "";
  if (typeof raw === "string" && (raw.startsWith("data:") || raw.startsWith("blob:"))) {
    return raw;
  }
  const cached = getExerciseImageCache(ejercicio);
  if (cached) return cached;
  return resolveImageUrl(raw);
}

export function compressImageToBase64(file, maxWidth = 600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      // Preserve animated GIFs directly as Data URL
      if (file.type === "image/gif") {
        resolve(dataUrl);
        return;
      }
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
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

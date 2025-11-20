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
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

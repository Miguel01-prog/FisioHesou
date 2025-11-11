export function formatDateDDMMYYYY (isoDate) {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
};

export function getUsuarioRol(user) {
    if (user?.rol === "fisioterapeuta") return "fisioterapia";
    if (user?.rol === "nutriologa") return "nutricion";
    return user?.rol || null;
};

export function toLocalISODate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

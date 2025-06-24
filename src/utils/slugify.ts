export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim()
    .substring(0, 50) // Limita o tamanho
}

export function generateDateSlug(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const year = now.getFullYear()
  return `${day}${month}${year}`
}

export function extractDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace("www.", "")
  } catch {
    return "link"
  }
}

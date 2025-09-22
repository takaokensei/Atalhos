import type { Metadata } from "next"
import FileUpload from "@/components/FileUpload"

export const metadata: Metadata = {
  title: "Gerenciador de Arquivos - Atalho Links",
  description: "Faça upload, gerencie e compartilhe seus arquivos com links de download personalizados",
  keywords: ["upload", "arquivos", "compartilhamento", "download", "gerenciador"],
}

export default function FilesPage() {
  return <FileUpload />
}

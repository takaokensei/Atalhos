import type { Metadata } from "next"
import FileUploader from "@/components/FileUpload"

export const metadata: Metadata = {
  title: "Gerenciador de Arquivos | Atalho Links",
  description: "Faça upload e gerencie seus arquivos com links de download personalizados",
}

export default function FilesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciador de Arquivos</h1>
        <p className="text-muted-foreground">
          Faça upload de arquivos e gere links de download personalizados para compartilhamento fácil.
        </p>
      </div>

      <FileUploader />
    </div>
  )
}

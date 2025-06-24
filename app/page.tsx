"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import type { LinkItem, SlugSuggestion } from "../src/types"
import { useGeminiSuggestions } from "../src/hooks/useGeminiSuggestions"
import { useLinkSync } from "../hooks/useLinkSync"
import ModernLinkInput from "../components/ModernLinkInput"
import AnimatedSuggestions from "../components/AnimatedSuggestions"
import ModernLinkCard from "../components/ModernLinkCard"
import { ThemeToggle } from "../components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LinkIcon,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  Info,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Globe,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
}

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    rotate: [0, 5, 0, -5, 0],
    transition: {
      duration: 6,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export default function Home() {
  const searchParams = useSearchParams()
  const searchSlug = searchParams.get("slug")
  const [filteredLinks, setFilteredLinks] = useState<LinkItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSuggestions, setCurrentSuggestions] = useState<SlugSuggestion[]>([])
  const [pendingUrl, setPendingUrl] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  // Use the sync system
  const { links, syncStatus, addLink, editLink, removeLink, checkSlugExists, manualSync } = useLinkSync()
  const { getSuggestions, loading, error } = useGeminiSuggestions()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Filter links based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLinks(links)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = links.filter(
        (link) =>
          link.slug.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.title && link.title.toLowerCase().includes(query)),
      )
      setFilteredLinks(filtered)
    }
  }, [links, searchQuery])

  const handleAddLink = async (url: string) => {
    setPendingUrl(url)
    setCurrentSuggestions([])

    try {
      const suggestions = await getSuggestions(url)
      setCurrentSuggestions(suggestions)
    } catch (err) {
      console.error("Erro ao obter sugestões:", err)
    }
  }

  const handleAddCustomLink = async (url: string, customSlug: string) => {
    if (checkSlugExists(customSlug)) {
      alert("Este slug já está sendo usado. Escolha outro.")
      return
    }

    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url,
      slug: customSlug,
      createdAt: new Date(),
    }

    const result = await addLink(newLink)
    if (!result.success) {
      alert(`Erro ao salvar link: ${result.error}`)
    }
  }

  const handleSelectSlug = async (slug: string) => {
    if (!pendingUrl) return

    if (checkSlugExists(slug)) {
      alert("Este slug já está sendo usado. Escolha outro.")
      return
    }

    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url: pendingUrl,
      slug,
      createdAt: new Date(),
    }

    const result = await addLink(newLink)
    if (result.success) {
      setPendingUrl("")
      setCurrentSuggestions([])
    } else {
      alert(`Erro ao salvar link: ${result.error}`)
    }
  }

  const handleEditLink = async (updatedLink: LinkItem) => {
    const result = await editLink(updatedLink)
    if (!result.success) {
      alert(`Erro ao atualizar link: ${result.error}`)
    }
  }

  const handleDeleteLink = async (id: string) => {
    const result = await removeLink(id)
    if (!result.success) {
      alert(`Erro ao deletar link: ${result.error}`)
    }
  }

  const exportLinks = () => {
    const dataStr = JSON.stringify(links, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "atalho-links.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importLinks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        const validLinks = imported.filter((link: any) => link.id && link.url && link.slug)

        for (const linkData of validLinks) {
          const link: LinkItem = {
            ...linkData,
            createdAt: new Date(linkData.createdAt || Date.now()),
          }
          await addLink(link)
        }

        alert(`${validLinks.length} links importados com sucesso!`)
      } catch (err) {
        alert("Erro ao importar arquivo. Verifique o formato.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const existingSlugs = links.map((link) => link.slug)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 animate-pulse" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

      {/* Floating Elements */}
      <motion.div
        className="fixed top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
        variants={floatingVariants}
        animate="animate"
      />
      <motion.div
        className="fixed top-40 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-xl"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 2 }}
      />
      <motion.div
        className="fixed bottom-20 left-1/4 w-24 h-24 bg-primary/5 rounded-full blur-xl"
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 4 }}
      />

      <div className="relative z-10">
        <motion.div
          className="container mx-auto px-4 py-8 max-w-7xl"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          {/* Modern Header */}
          <motion.div ref={heroRef} className="text-center mb-16" style={{ y, opacity }} variants={itemVariants}>
            <div className="flex items-center justify-center gap-4 mb-8">
              <motion.div className="relative" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
                <div className="p-4 bg-gradient-to-br from-primary to-primary-light rounded-2xl shadow-2xl animate-glow">
                  <LinkIcon className="h-10 w-10 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </motion.div>

              <div className="text-left">
                <motion.h1
                  className="text-6xl font-black text-gradient mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Atalho
                </motion.h1>
                <motion.div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Powered by AI</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </motion.div>
              </div>

              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>

            <motion.div className="max-w-4xl mx-auto mb-8" variants={itemVariants}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-shadow">
                Transforme seus links em <span className="text-gradient">atalhos inteligentes</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Organize, compartilhe e acesse seus links favoritos com slugs gerados por IA. Uma experiência moderna e
                intuitiva para gerenciar sua biblioteca digital.
              </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12"
              variants={containerVariants}
            >
              <motion.div
                className="glass-card p-6 text-center hover-lift"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-gradient">{links.length}</div>
                <div className="text-sm text-muted-foreground">Links Criados</div>
              </motion.div>

              <motion.div
                className="glass-card p-6 text-center hover-lift"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-2xl font-bold text-gradient">IA</div>
                <div className="text-sm text-muted-foreground">Sugestões Inteligentes</div>
              </motion.div>

              <motion.div
                className="glass-card p-6 text-center hover-lift"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gradient">24/7</div>
                <div className="text-sm text-muted-foreground">Disponibilidade</div>
              </motion.div>
            </motion.div>

            {/* Sync Status */}
            <motion.div className="flex items-center justify-center gap-3" variants={itemVariants}>
              <AnimatePresence mode="wait">
                {syncStatus.syncing ? (
                  <motion.div
                    key="syncing"
                    className="flex items-center gap-2 glass-card px-4 py-2 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Sincronizando...</span>
                  </motion.div>
                ) : syncStatus.error ? (
                  <motion.div
                    key="offline"
                    className="flex items-center gap-2 glass-card px-4 py-2 rounded-full border-orange-200"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <WifiOff className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-600">Modo Offline</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="online"
                    className="flex items-center gap-2 glass-card px-4 py-2 rounded-full border-green-200"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Sincronizado</span>
                    {syncStatus.lastSync && (
                      <span className="text-xs text-muted-foreground">
                        • {syncStatus.lastSync.toLocaleTimeString()}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="ghost"
                size="sm"
                onClick={manualSync}
                disabled={syncStatus.syncing}
                className="glass-card hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 ${syncStatus.syncing ? "animate-spin" : ""}`} />
              </Button>
            </motion.div>
          </motion.div>

          {/* Error/Not Found Message */}
          <AnimatePresence>
            {searchSlug && (
              <motion.div
                className="mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                variants={itemVariants}
              >
                <div className="glass-card p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Slug não encontrado</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-200">
                        O slug{" "}
                        <code className="bg-orange-100 dark:bg-orange-800 px-2 py-1 rounded font-mono">
                          {searchSlug}
                        </code>{" "}
                        não existe. Crie um novo link abaixo!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modern Link Input */}
          <motion.div className="mb-12" variants={itemVariants}>
            <ModernLinkInput onAddLink={handleAddLink} onAddCustomLink={handleAddCustomLink} loading={loading} />

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-6 max-w-2xl mx-auto"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="glass-card p-4 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/50">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <strong className="text-yellow-800 dark:text-yellow-200">Aviso:</strong>
                        <span className="text-yellow-700 dark:text-yellow-300 ml-1">{error}</span>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Sugestões básicas foram geradas automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Animated Suggestions */}
          <AnimatePresence>
            {(currentSuggestions.length > 0 || loading) && (
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                variants={itemVariants}
              >
                <AnimatedSuggestions
                  suggestions={currentSuggestions}
                  onSelectSlug={handleSelectSlug}
                  loading={loading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Links Section */}
          <motion.div className="max-w-6xl mx-auto" variants={itemVariants}>
            {/* Header with controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <h2 className="text-3xl font-bold text-gradient mb-2">Meus Links ({filteredLinks.length})</h2>
                <p className="text-muted-foreground">Gerencie e organize seus atalhos inteligentes</p>
              </motion.div>

              {links.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {/* Search */}
                  <div className="relative flex-1 lg:flex-initial min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar links..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass-card border-0 bg-white/50 dark:bg-black/20"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportLinks}
                      className="glass-card border-0 hover:bg-primary/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Exportar</span>
                    </Button>

                    <label>
                      <Button variant="outline" size="sm" asChild className="glass-card border-0 hover:bg-primary/10">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Importar</span>
                        </span>
                      </Button>
                      <input type="file" accept=".json" onChange={importLinks} className="hidden" />
                    </label>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Links Grid */}
            <AnimatePresence mode="wait">
              {filteredLinks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-20"
                >
                  <div className="glass-card p-12 max-w-md mx-auto">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                      className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                      <Sparkles className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">
                      {searchQuery ? "Nenhum link encontrado" : "Comece sua jornada"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery
                        ? "Tente buscar por outro termo ou limpe o filtro."
                        : "Adicione seu primeiro link e descubra o poder dos atalhos inteligentes!"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => document.querySelector('input[placeholder*="https://"]')?.focus()}
                        className="gradient-primary text-white hover:opacity-90"
                      >
                        Criar Primeiro Link
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredLinks.map((link, index) => (
                    <motion.div key={link.id} variants={itemVariants} custom={index} layout>
                      <ModernLinkCard
                        link={link}
                        onDelete={handleDeleteLink}
                        onEdit={handleEditLink}
                        existingSlugs={existingSlugs.filter((slug) => slug !== link.slug)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Modern Help Section */}
          <motion.div
            className="mt-20 text-center"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="glass-card p-8 max-w-4xl mx-auto">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Star className="h-8 w-8 text-white" />
              </motion.div>

              <h3 className="text-2xl font-bold text-gradient mb-4">Como funciona?</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {[
                  {
                    step: "01",
                    title: "Cole seu link",
                    description: "Adicione qualquer URL no campo acima",
                    icon: LinkIcon,
                  },
                  {
                    step: "02",
                    title: "IA gera sugestões",
                    description: "Receba slugs inteligentes baseados no conteúdo",
                    icon: Sparkles,
                  },
                  {
                    step: "03",
                    title: "Acesse rapidamente",
                    description: "Use atalho.vercel.app/seu-slug",
                    icon: Zap,
                  },
                  {
                    step: "04",
                    title: "Sincronização automática",
                    description: "Links salvos em todos os dispositivos",
                    icon: RefreshCw,
                  },
                  {
                    step: "05",
                    title: "Edição flexível",
                    description: "Modifique links existentes facilmente",
                    icon: Globe,
                  },
                  {
                    step: "06",
                    title: "Compartilhamento",
                    description: "Exporte e importe coleções de links",
                    icon: Upload,
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-primary mb-1">{item.step}</div>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                viewport={{ once: true }}
              >
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica Pro:</strong> Links são salvos automaticamente na nuvem e sincronizados entre todos os
                  seus dispositivos. Funciona offline com sincronização automática quando conectado.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { SlugSuggestion } from "../hooks/useGeminiSuggestions"
import { Sparkles, Check, AlertCircle, Zap, Star, TrendingUp } from "lucide-react"

interface AnimatedSuggestionsProps {
  suggestions: SlugSuggestion[]
  onSelectSlug: (slug: string) => void
  loading?: boolean
}

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
  hidden: { opacity: 0, x: -20, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
}

const loadingVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export default function AnimatedSuggestions({ suggestions, onSelectSlug, loading }: AnimatedSuggestionsProps) {
  if (loading) {
    return (
      <motion.div className="w-full max-w-3xl mx-auto" variants={loadingVariants} initial="hidden" animate="visible">
        <div className="glass-card p-8 relative overflow-hidden">
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, hsl(217 91% 60%) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, hsl(270 95% 75%) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, hsl(217 91% 60%) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          <div className="relative z-10">
            <motion.div className="text-center mb-8" variants={itemVariants}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center"
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-gradient">IA Trabalhando</h3>
                  <p className="text-sm text-muted-foreground">Gerando sugestões inteligentes...</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
                  variants={pulseVariants}
                  animate="animate"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div className="w-12 h-12 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/50 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                    <div className="h-3 bg-muted/30 rounded animate-pulse" style={{ width: `${40 + i * 15}%` }} />
                  </div>
                  <div className="w-20 h-8 bg-muted/50 rounded animate-pulse" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  const getQualityIcon = (description: string) => {
    if (description.includes("básicas") || description.includes("API")) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    }
    if (description.includes("inteligente") || description.includes("IA")) {
      return <Star className="h-4 w-4 text-primary" />
    }
    return <TrendingUp className="h-4 w-4 text-green-500" />
  }

  const getQualityColor = (description: string) => {
    if (description.includes("básicas") || description.includes("API")) {
      return "border-amber-200 bg-amber-50/50 dark:bg-amber-950/50"
    }
    if (description.includes("inteligente") || description.includes("IA")) {
      return "border-primary/20 bg-primary/5"
    }
    return "border-green-200 bg-green-50/50 dark:bg-green-950/50"
  }

  return (
    <motion.div className="w-full max-w-3xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <div className="glass-card p-8 relative overflow-hidden">
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, hsl(217 91% 60%) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(270 95% 75%) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, hsl(217 91% 60%) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        <div className="relative z-10">
          {/* Header */}
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center"
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gradient">Sugestões Inteligentes</h3>
                <p className="text-sm text-muted-foreground">Escolha o atalho perfeito para seu link</p>
              </div>
            </div>
          </motion.div>

          {/* Suggestions List */}
          <div className="space-y-4">
            <AnimatePresence>
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-lg ${getQualityColor(suggestion.description || "")}`}
                  variants={itemVariants}
                  custom={index}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <motion.div
                        className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-lg border"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Zap className="h-3 w-3 text-primary" />
                        <code className="text-sm font-mono font-semibold text-foreground">{suggestion.slug}</code>
                      </motion.div>

                      <motion.div
                        className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        #{index + 1}
                      </motion.div>
                    </div>

                    {suggestion.description && (
                      <motion.p
                        className="text-sm text-muted-foreground flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                      >
                        {getQualityIcon(suggestion.description)}
                        {suggestion.description}
                      </motion.p>
                    )}
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onSelectSlug(suggestion.slug)}
                      className="gradient-primary text-white hover:opacity-90 shadow-lg"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Usar
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div className="mt-6 text-center" variants={itemVariants}>
            <p className="text-xs text-muted-foreground">
              💡 Sugestões geradas por IA baseadas no conteúdo do seu link
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

import React from "react";

/**
 * Renderiza o markdown básico do WhatsApp como nodes React.
 * - *texto*  → negrito
 * - _texto_  → itálico
 * - ~texto~  → tachado
 * - `texto`  → monospace
 * - Quebras de linha preservadas pelo CSS (whitespace-pre-wrap).
 */
export function renderWhatsAppMarkdown(text: string): React.ReactNode {
  if (!text) return text;

  // Regex que captura cada marcador WhatsApp. Usa look-behind/ahead simples
  // exigindo que o delimitador esteja em borda de palavra/pontuação.
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("~") && part.endsWith("~") && part.length > 2) {
      return (
        <span key={i} className="line-through">
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="font-mono text-xs bg-black/5 rounded px-1">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
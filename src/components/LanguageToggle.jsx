import React from 'react'
import { Globe } from 'lucide-react'
import { useLang } from '@/lib/LanguageContext'

export default function LanguageToggle({ className }) {
  const { lang, toggle } = useLang()
  return (
    <button onClick={toggle} className={className || 'lang-toggle'}>
      <Globe size={14} />
      <span>{lang === 'en' ? 'EN' : 'FIL'}</span>
    </button>
  )
}
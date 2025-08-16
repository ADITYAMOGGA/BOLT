import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ar';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.transfer': {
    en: 'Transfer',
    es: 'Transferir',
    fr: 'Transférer',
    de: 'Übertragen',
    zh: '传输',
    ja: '転送',
    ar: 'نقل'
  },
  'nav.product': {
    en: 'Product',
    es: 'Producto',
    fr: 'Produit',
    de: 'Produkt',
    zh: '产品',
    ja: '製品',
    ar: 'منتج'
  },
  'nav.pricing': {
    en: 'Pricing',
    es: 'Precios',
    fr: 'Tarifs',
    de: 'Preise',
    zh: '定价',
    ja: '価格',
    ar: 'التسعير'
  },
  'nav.download': {
    en: 'Download',
    es: 'Descargar',
    fr: 'Télécharger',
    de: 'Herunterladen',
    zh: '下载',
    ja: 'ダウンロード',
    ar: 'تحميل'
  },
  'nav.contact': {
    en: 'Contact Us',
    es: 'Contáctanos',
    fr: 'Nous contacter',
    de: 'Kontakt',
    zh: '联系我们',
    ja: 'お問い合わせ',
    ar: 'اتصل بنا'
  },
  'nav.login': {
    en: 'Login',
    es: 'Iniciar sesión',
    fr: 'Connexion',
    de: 'Anmelden',
    zh: '登录',
    ja: 'ログイン',
    ar: 'تسجيل الدخول'
  },
  
  // Main Actions
  'actions.title': {
    en: 'Actions',
    es: 'Acciones',
    fr: 'Actions',
    de: 'Aktionen',
    zh: '操作',
    ja: 'アクション',
    ar: 'الإجراءات'
  },
  'send.title': {
    en: 'Send',
    es: 'Enviar',
    fr: 'Envoyer',
    de: 'Senden',
    zh: '发送',
    ja: '送信',
    ar: 'إرسال'
  },
  'send.description': {
    en: 'Upload files up to 200MB',
    es: 'Subir archivos hasta 200MB',
    fr: 'Télécharger des fichiers jusqu\'à 200 Mo',
    de: 'Dateien bis zu 200 MB hochladen',
    zh: '上传最大200MB的文件',
    ja: '200MBまでのファイルをアップロード',
    ar: 'رفع ملفات تصل إلى 200 ميجابايت'
  },
  'receive.title': {
    en: 'Receive',
    es: 'Recibir',
    fr: 'Recevoir',
    de: 'Empfangen',
    zh: '接收',
    ja: '受信',
    ar: 'استقبال'
  },
  'receive.description': {
    en: 'Enter 6-character code',
    es: 'Ingresa código de 6 caracteres',
    fr: 'Entrez le code à 6 caractères',
    de: '6-stelligen Code eingeben',
    zh: '输入6位字符代码',
    ja: '6文字のコードを入力',
    ar: 'أدخل رمز مكون من 6 أحرف'
  },
  'receive.placeholder': {
    en: 'ABC123',
    es: 'ABC123',
    fr: 'ABC123',
    de: 'ABC123',
    zh: 'ABC123',
    ja: 'ABC123',
    ar: 'ABC123'
  },
  
  // Overview Section
  'overview.title': {
    en: 'Overview',
    es: 'Resumen',
    fr: 'Aperçu',
    de: 'Übersicht',
    zh: '概述',
    ja: '概要',
    ar: 'نظرة عامة'
  },
  'stats.encryption': {
    en: 'Encryption',
    es: 'Cifrado',
    fr: 'Chiffrement',
    de: 'Verschlüsselung',
    zh: '加密',
    ja: '暗号化',
    ar: 'التشفير'
  },
  'stats.maxSize': {
    en: 'Max Size',
    es: 'Tamaño máx.',
    fr: 'Taille max',
    de: 'Max. Größe',
    zh: '最大大小',
    ja: '最大サイズ',
    ar: 'الحد الأقصى'
  },
  'stats.autoDelete': {
    en: 'Auto Delete',
    es: 'Eliminación auto',
    fr: 'Suppression auto',
    de: 'Auto-Löschung',
    zh: '自动删除',
    ja: '自動削除',
    ar: 'حذف تلقائي'
  },
  
  // Upload Progress
  'upload.uploading': {
    en: 'Uploading...',
    es: 'Subiendo...',
    fr: 'Téléchargement...',
    de: 'Hochladen...',
    zh: '上传中...',
    ja: 'アップロード中...',
    ar: 'جاري الرفع...'
  },
  'upload.complete': {
    en: 'Complete',
    es: 'Completo',
    fr: 'Terminé',
    de: 'Abgeschlossen',
    zh: '完成',
    ja: '完了',
    ar: 'مكتمل'
  },
  'upload.preparing': {
    en: 'Preparing upload...',
    es: 'Preparando subida...',
    fr: 'Préparation du téléchargement...',
    de: 'Upload wird vorbereitet...',
    zh: '准备上传...',
    ja: 'アップロードの準備中...',
    ar: 'جاري تحضير الرفع...'
  },
  'upload.calculating': {
    en: 'Calculating...',
    es: 'Calculando...',
    fr: 'Calcul en cours...',
    de: 'Wird berechnet...',
    zh: '计算中...',
    ja: '計算中...',
    ar: 'جاري الحساب...'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const availableLanguages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
  { code: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' }
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    let detectedLanguage: Language = 'en';
    
    if (savedLanguage && availableLanguages.find(lang => lang.code === savedLanguage)) {
      detectedLanguage = savedLanguage;
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (availableLanguages.find(lang => lang.code === browserLang)) {
        detectedLanguage = browserLang;
      }
    }
    
    setLanguage(detectedLanguage);
    
    // Set document direction for RTL languages
    if (detectedLanguage === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, []);

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Set document direction for RTL languages
    if (newLanguage === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        availableLanguages
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
import { useTranslation } from "react-i18next"

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem("i18nextLng", lng)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage("en")}
        className={`px-2 py-1 border rounded transition-colors ${
          i18n.language === "en" 
            ? "bg-primary text-white border-primary" 
            : "hover:bg-primary hover:text-white dark:border-gray-600"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage("hi")}
        className={`px-2 py-1 border rounded transition-colors ${
          i18n.language === "hi" 
            ? "bg-primary text-white border-primary" 
            : "hover:bg-primary hover:text-white dark:border-gray-600"
        }`}
      >
        HI
      </button>
    </div>
  )
}

export default LanguageSwitcher

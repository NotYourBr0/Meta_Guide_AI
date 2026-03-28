import { useTranslation } from "react-i18next"

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem("i18nextLng", lng)
  }

  const isEN = i18n.language === "en" || i18n.language?.startsWith("en")
  const isHI = i18n.language === "hi" || i18n.language?.startsWith("hi")

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => changeLanguage("en")}
        title="English"
        className={`px-2.5 py-1 rounded-md text-sm font-medium transition-all ${
          isEN
            ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage("hi")}
        title="हिंदी"
        className={`px-2.5 py-1 rounded-md text-sm font-medium transition-all ${
          isHI
            ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
      >
        HING
      </button>
    </div>
  )
}

export default LanguageSwitcher

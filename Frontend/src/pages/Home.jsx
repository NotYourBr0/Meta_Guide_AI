import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Home = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin } = useAuth()

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Welcome Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {isAuthenticated
            ? t("home.welcomeBack", { name: user?.name || "User" })
            : t("home.welcome", { name: "Guest" })}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {isAuthenticated
            ? t("home.taglineAuth") || "Continue your learning journey with AI-powered explanations and simulations"
            : t("home.tagline") || "Learn complex topics with AI-powered explanations and interactive simulations"}
        </p>
      </div>

      {isAuthenticated ? (
        // Authenticated User View
        <div className="space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("home.quickActions") || "Quick Actions"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Subjects Card */}
              <Link
                to="/subjects"
                className="group p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-sky-500"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-sky-100 dark:bg-sky-900 rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("home.browseSubjects") || "Browse Subjects"}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("home.subjectsDesc") || "Explore subjects across different levels"}
                </p>
              </Link>

              {/* Profile Card */}
              <Link
                to="/profile"
                className="group p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-violet-500"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900 rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("home.yourProfile") || "Your Profile"}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("home.profileDesc") || "View and manage your account"}
                </p>
              </Link>

              {/* Admin Card (Only for Super Admins) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="group p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-red-500"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t("home.adminDashboard") || "Admin Dashboard"}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("home.adminDesc") || "Manage users, subjects, and topics"}
                  </p>
                </Link>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("home.features") || "Features"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900 dark:to-sky-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("home.feature1Title") || "AI-Powered Explanations"}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("home.feature1Desc") || "Get detailed explanations tailored to your learning level"}
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("home.feature2Title") || "Interactive Simulations"}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("home.feature2Desc") || "Learn by doing with AI-generated interactive simulations"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Unauthenticated User View
        <div className="space-y-8">
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-sky-500 to-violet-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t("home.getStarted") || "Get Started Today"}
            </h2>
            <p className="text-xl mb-8 text-sky-100">
              {t("home.ctaDesc") || "Join thousands of learners using AI to master complex topics"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/signup"
                className="px-8 py-3 bg-white text-sky-600 rounded-full font-semibold hover:bg-sky-50 transition-colors shadow-lg"
              >
                {t("navbar.signup") || "Sign Up Free"}
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-sky-600 transition-colors"
              >
                {t("navbar.login") || "Login"}
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-white">
              {t("home.whyChoose") || "Why Choose MetaGuide AI?"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="text-5xl mb-4"></div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("home.adaptiveTitle") || "Adaptive Learning"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("home.adaptiveDesc") || "Content adapts to your level - from school to university"}
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl mb-4"></div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("home.instantTitle") || "Instant Explanations"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("home.instantDesc") || "Get AI-generated explanations in seconds"}
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl mb-4"></div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("home.multiLangTitle") || "Multi-Language"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("home.multiLangDesc") || "Learn in your preferred language"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

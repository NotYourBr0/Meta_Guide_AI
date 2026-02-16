import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

const Profile = () => {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">{t("common.loading") || "Loading..."}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-600">{t("profile.notLoggedIn") || "Please log in to view your profile"}</div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        {t("profile.title") || "Your Profile"}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header Section with Avatar */}
        <div className="bg-gradient-to-r from-sky-500 to-violet-600 p-8 text-white">
          <div className="flex items-center gap-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sky-100 mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 space-y-6">
          {/* Role Badge */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t("profile.role") || "Role"}:
            </span>
            <span
              className={`px-4 py-1 rounded-full text-sm font-semibold ${
                user.role === 'superadmin'
                  ? 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200'
                  : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
              }`}
            >
              {user.role === 'superadmin' ? 'Super Admin' : 'User'}
            </span>
          </div>

          {/* Account Type */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t("profile.accountType") || "Account Type"}:
            </span>
            <div className="flex items-center gap-2">
              {user.isGoogleUser ? (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-900 dark:text-white">Google Account</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">Email & Password</span>
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t("profile.email") || "Email"}:
            </span>
            <span className="text-gray-900 dark:text-white">{user.email}</span>
          </div>

          {/* User ID */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              User ID:
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-mono">{user.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 border-t dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("profile.memberSince") || "Member since"}: {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Subjects Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span>My Subjects</span>
            <span className="bg-sky-100 text-sky-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-sky-900 dark:text-sky-200">
              {user.stats?.subjectsCount || 0}
            </span>
          </h3>
          {user.stats?.subjects?.length > 0 ? (
            <ul className="space-y-2">
              {user.stats.subjects.map(subject => (
                <li key={subject._id} className="p-3 border rounded hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                    <span className="capitalize">{subject.level}</span>
                    <span>{formatDate(subject.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No subjects created yet.</p>
          )}
        </div>

        {/* Topics Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span>My Topics</span>
            <span className="bg-violet-100 text-violet-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-violet-900 dark:text-violet-200">
              {user.stats?.topicsCount || 0}
            </span>
          </h3>
          {user.stats?.topics?.length > 0 ? (
            <ul className="space-y-2">
              {user.stats.topics.map(topic => (
                <li key={topic._id} className="p-3 border rounded hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                  <div className="font-medium">{topic.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                    <span className="capitalize">{topic.level}</span>
                    <span>{formatDate(topic.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No topics created yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

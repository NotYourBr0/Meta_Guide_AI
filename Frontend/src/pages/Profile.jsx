import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

const Profile = () => {
  const { user, loading, updateName } = useAuth()
  const { t } = useTranslation()

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleEditStart = () => {
    setNameInput(user.name)
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setNameInput('')
  }

  const handleSave = async () => {
    if (!nameInput.trim() || nameInput.trim() === user.name) {
      setEditing(false)
      return
    }
    setSaving(true)
    const result = await updateName(nameInput.trim())
    setSaving(false)
    setEditing(false)
    if (result.success) {
      showToast('success', t('profile.nameUpdated'))
    } else {
      showToast('error', result.message || t('profile.nameError'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl">{t('subjects.loading')}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-600">{t('profile.notLoggedIn')}</div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        {t('profile.title')}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header with Avatar */}
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

            <div className="flex-1 min-w-0">
              {/* Inline name editor */}
              {editing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
                    maxLength={50}
                    placeholder={t('profile.namePlaceholder')}
                    className="bg-white/20 border border-white/50 rounded-lg px-3 py-1.5 text-white placeholder-white/60 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/70 w-full max-w-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1.5 bg-white text-sky-600 rounded-lg text-sm font-semibold hover:bg-sky-50 disabled:opacity-60 transition-colors"
                    >
                      {saving ? '...' : t('profile.saveName')}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors"
                    >
                      {t('profile.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-2xl font-bold truncate">{user.name}</h2>
                  <button
                    onClick={handleEditStart}
                    title={t('profile.editName')}
                    className="opacity-50 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-sky-100 mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 space-y-6">
          {/* Role Badge */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t('profile.role')}:
            </span>
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
              user.role === 'superadmin'
                ? 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200'
                : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
            }`}>
              {user.role === 'superadmin' ? t('profile.superAdmin') : t('profile.userRole')}
            </span>
          </div>

          {/* Account Type */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t('profile.accountType')}:
            </span>
            <div className="flex items-center gap-2">
              {user.isGoogleUser ? (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">{t('profile.googleAccount')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">{t('profile.emailPassword')}</span>
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t('profile.email')}:
            </span>
            <span className="text-gray-900 dark:text-white">{user.email}</span>
          </div>

          {/* User ID */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-medium w-32">
              {t('profile.userId')}:
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-mono">{user.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 border-t dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('profile.memberSince')}: {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Subjects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span>{t('profile.mySubjects')}</span>
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
            <p className="text-gray-500 italic">{t('profile.noSubjects')}</p>
          )}
        </div>

        {/* Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span>{t('profile.myTopics')}</span>
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
            <p className="text-gray-500 italic">{t('profile.noTopics')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

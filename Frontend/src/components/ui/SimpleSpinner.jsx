import React from 'react'

/**
 * SimpleSpinner — A clean, circular blue loader for general UI loading states.
 */
const SimpleSpinner = ({ label, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  const currentSize = sizeClasses[size] || sizeClasses.md

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-4">
      <div className={`${currentSize} border-sky-400 border-t-transparent rounded-full animate-spin shadow-sm`}></div>
      {label && (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          {label}
        </p>
      )}
    </div>
  )
}

export default SimpleSpinner

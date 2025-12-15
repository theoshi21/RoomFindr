'use client'

import { useState, useEffect } from 'react'
import { 
  HeartIcon as Heart, 
  UsersIcon as Users, 
  FunnelIcon as Filter,
  ChevronUpIcon as SortAsc,
  ChevronDownIcon as SortDesc
} from '@heroicons/react/24/outline'
import type { RoommateProfile, CompatibilityScore, RoommateSearchFilters } from '@/types/roommate'
import { getCompatibilityScores, searchRoommateProfiles } from '@/lib/roommate'
import RoommateProfileDisplay from './RoommateProfileDisplay'

interface CompatibilityMatcherProps {
  propertyId: string
  currentUserProfileId: string
  currentUserProfile: RoommateProfile
  className?: string
}

type SortOption = 'compatibility' | 'age' | 'moveInDate'
type SortDirection = 'asc' | 'desc'

export default function CompatibilityMatcher({
  propertyId,
  currentUserProfileId,
  currentUserProfile,
  className = ''
}: CompatibilityMatcherProps) {
  const [profiles, setProfiles] = useState<RoommateProfile[]>([])
  const [compatibilityScores, setCompatibilityScores] = useState<CompatibilityScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('compatibility')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filters, setFilters] = useState<RoommateSearchFilters>({})

  useEffect(() => {
    loadProfiles()
  }, [propertyId, currentUserProfileId, filters])

  useEffect(() => {
    if (profiles.length > 0) {
      loadCompatibilityScores()
    }
  }, [profiles])

  const loadProfiles = async () => {
    setLoading(true)
    setError(null)

    const { profiles: data, error: err } = await searchRoommateProfiles(propertyId, filters)
    
    if (err) {
      setError(err)
    } else {
      // Filter out current user's profile
      const filteredProfiles = data.filter(profile => profile.id !== currentUserProfileId)
      setProfiles(filteredProfiles)
    }
    
    setLoading(false)
  }

  const loadCompatibilityScores = async () => {
    const { scores, error: err } = await getCompatibilityScores(propertyId, currentUserProfileId)
    
    if (err) {
      console.error('Failed to load compatibility scores:', err)
    } else {
      setCompatibilityScores(scores)
    }
  }

  const getCompatibilityScore = (userId: string): number => {
    const score = compatibilityScores.find(s => s.userId === userId)
    return score?.score || 0
  }

  const getSortedProfiles = () => {
    const sorted = [...profiles].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'compatibility':
          comparison = getCompatibilityScore(b.userId) - getCompatibilityScore(a.userId)
          break
        case 'age':
          comparison = (a.age || 0) - (b.age || 0)
          break
        case 'moveInDate':
          comparison = new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime()
          break
      }

      return sortDirection === 'desc' ? -comparison : comparison
    })

    return sorted
  }

  const updateFilters = (newFilters: Partial<RoommateSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortDirection('desc')
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading roommate profiles: {error}</p>
          <button
            onClick={loadProfiles}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const sortedProfiles = getSortedProfiles()

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Compatibility Matcher
            </h2>
            <p className="text-gray-600 mt-1">
              Find your ideal roommates based on lifestyle compatibility
            </p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.ageRange?.min || ''}
                    onChange={(e) => updateFilters({
                      ageRange: {
                        ...filters.ageRange,
                        min: parseInt(e.target.value) || 18,
                        max: filters.ageRange?.max || 65
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.ageRange?.max || ''}
                    onChange={(e) => updateFilters({
                      ageRange: {
                        min: filters.ageRange?.min || 18,
                        max: parseInt(e.target.value) || 65
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={filters.gender || 'any'}
                  onChange={(e) => updateFilters({ gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-Binary</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          
          <button
            onClick={() => toggleSort('compatibility')}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              sortBy === 'compatibility' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Compatibility
            {sortBy === 'compatibility' && (
              sortDirection === 'desc' ? <SortDesc className="w-3 h-3 ml-1" /> : <SortAsc className="w-3 h-3 ml-1" />
            )}
          </button>

          <button
            onClick={() => toggleSort('age')}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              sortBy === 'age' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Age
            {sortBy === 'age' && (
              sortDirection === 'desc' ? <SortDesc className="w-3 h-3 ml-1" /> : <SortAsc className="w-3 h-3 ml-1" />
            )}
          </button>

          <button
            onClick={() => toggleSort('moveInDate')}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              sortBy === 'moveInDate' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Move-in Date
            {sortBy === 'moveInDate' && (
              sortDirection === 'desc' ? <SortDesc className="w-3 h-3 ml-1" /> : <SortAsc className="w-3 h-3 ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="p-6">
        {sortedProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Roommates Found</h3>
            <p className="text-gray-600">
              {Object.keys(filters).length > 0 
                ? 'Try adjusting your filters to see more results.'
                : 'No other roommate profiles available for this property yet.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedProfiles.map((profile) => (
              <RoommateProfileDisplay
                key={profile.id}
                profile={profile}
                currentUserProfile={currentUserProfile}
                showCompatibility={true}
                className="h-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
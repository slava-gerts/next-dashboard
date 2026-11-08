'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import Link from 'next/link'

import { GetSuggestionsDocument } from '@/graphql/generated'

import SuggestionCard from './suggestion-card'

import styles from './page.module.css'

export default function SuggestionList() {
	const [searchInput, setSearchInput] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')

	const query = useSuggestion(debouncedSearch)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchInput.trim())
		}, 300)

		return () => clearTimeout(timer)
	}, [searchInput])

	const isDebouncing = searchInput.trim() !== debouncedSearch

	return (
		<div className={styles.list}>
			<label className={styles.searchField}>
				Search suggestions
				<input
					type="search"
					name="search"
					placeholder="Search by title..."
					value={searchInput}
					onChange={(event) => setSearchInput(event.target.value)}
				/>
			</label>

			<p className={styles.searchStatus} role="status">
				{isDebouncing || query.loading ? 'Updating results...' : ''}
			</p>

			<SuggestionResults key={debouncedSearch} search={debouncedSearch} query={query} />
		</div>
	)
}

function useSuggestion(search: string) {
	return useQuery(GetSuggestionsDocument, {
		variables: {
			first: 2,
			after: null,
			search,
		},
		ssr: false,
	})
}

function SuggestionResults({ search, query }: { search: string, query: ReturnType<typeof useSuggestion> }) {
	const [loadingMore, setLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

	const { data, previousData, loading, error, fetchMore } = query

	const visibleData = data ?? (loading ? previousData : undefined)
	const showingPreviousResults = loading && !data && !!previousData

	async function handleLoadMore() {
		const pageInfo = data?.suggestions.pageInfo

		if (loading || loadingMore || !pageInfo?.hasNextPage || pageInfo.endCursor === null) return

		setLoadingMore(true)
		setLoadMoreError(null)

		try {
			await fetchMore({
				variables: {
					after: pageInfo.endCursor,
				},
				updateQuery(previous, { fetchMoreResult }) {
					return {
						...fetchMoreResult,
						suggestions: {
							...fetchMoreResult.suggestions,
							nodes: [
								...previous.suggestions.nodes,
								...fetchMoreResult.suggestions.nodes,
							],
						},
					}
				},
			})
		} catch {
			setLoadMoreError('Could not load more suggestions. Try again.')
		} finally {
			setLoadingMore(false)
		}
	}

	if (loading && !visibleData) return <p role="status">Loading suggestions...</p>

	if (error && !data) return <p role="alert">{error.message}</p>

	const suggestions = visibleData?.suggestions?.nodes ?? []

	if (suggestions.length === 0) {
		if (loading) return <p>Loading suggestions...</p>

		return <p>{search ? 'No matching suggestions.' : 'No suggestions yet.'}</p>
	}

	return (
		<div
			className={`${styles.list} ${showingPreviousResults ? styles.staleResults : ''}`}
			aria-busy={loading}
			inert={showingPreviousResults}
		>
			{suggestions.map((suggestion) => (
				<article key={suggestion.id} className={styles.card}>
					<SuggestionCard suggestion={suggestion} />

					<Link href={`/suggestions/${suggestion.id}`} className={styles.detailsLink}>
						View discussion →
					</Link>
				</article>
			))}

			{visibleData?.suggestions.pageInfo.hasNextPage && (
				<button type="button" disabled={loading || loadingMore} onClick={handleLoadMore}>
					{loadingMore ? 'Loading...' : 'Load more'}
				</button>
			)}

			{loadMoreError && <p role="alert">{loadMoreError}</p>}
		</div>
	)
}

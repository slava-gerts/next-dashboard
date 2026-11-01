'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import Link from 'next/link'

import { GetSuggestionsDocument } from '@/graphql/generated'

import SuggestionCard from './suggestion-card'

import styles from './page.module.css'

export default function SuggestionList() {
	const [loadingMore, setLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

	const { data, loading, error, fetchMore } = useQuery(GetSuggestionsDocument, {
		variables: {
			first: 2,
			after: null,
		},
		ssr: false,
	})

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

	if (loading && !data) return <p role="status">Loading suggestions...</p>

	if (error && !data) return <p role="alert">{error.message}</p>

	const suggestions = data?.suggestions?.nodes ?? []

	if (suggestions.length === 0) return <p>No suggestions yet.</p>

	return (
		<div className={styles.list}>
			{suggestions.map((suggestion) => (
				<article key={suggestion.id} className={styles.card}>
					<SuggestionCard suggestion={suggestion} />

					<Link href={`/suggestions/${suggestion.id}`} className={styles.detailsLink}>
						View discussion →
					</Link>
				</article>
			))}

			{data?.suggestions.pageInfo.hasNextPage && (
				<button type="button" disabled={loading || loadingMore} onClick={handleLoadMore}>
					{loadingMore ? 'Loading...' : 'Load more'}
				</button>
			)}

			{loadMoreError && <p role="alert">{loadMoreError}</p>}
		</div>
	)
}

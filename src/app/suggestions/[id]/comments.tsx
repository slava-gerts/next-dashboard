'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client/react'

import { GetCommentsDocument } from '@/graphql/generated'

import CreateCommentForm from './create-comment-form'

import styles from '../../page.module.css'

type Props = {
	suggestionId: string
}

function CommentsContent({ suggestionId }: Props) {
	const [loadingMore, setLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

	const { data, loading, error, fetchMore } = useQuery(GetCommentsDocument, {
		variables: {
			id: suggestionId,
			first: 2,
			after: null,
		},
		ssr: false,
	})

	async function handleLoadMore() {
		const pageInfo = data?.suggestion?.comments.pageInfo

		if (loading || loadingMore || !pageInfo?.hasNextPage || pageInfo.endCursor === null) return

		setLoadingMore(true)
		setLoadMoreError(null)

		try {
			await fetchMore({
				variables: {
					after: pageInfo.endCursor,
				},
				updateQuery(previous, { fetchMoreResult }) {
					const previousSuggestion = previous.suggestion
					const nextSuggestion = fetchMoreResult.suggestion

					if (!previousSuggestion || !nextSuggestion) return previous

					return {
						...previous,
						suggestion: {
							...previousSuggestion,
							comments: {
								...nextSuggestion.comments,
								nodes: [
									...previousSuggestion.comments.nodes,
									...nextSuggestion.comments.nodes,
								],
							},
						},
					}
				},
			})
		} catch {
			setLoadMoreError('Could not load more comments. Try again.')
		} finally {
			setLoadingMore(false)
		}
	}

	if (loading && !data) return <p role="status">Loading comments...</p>

	if (error && !data) return <p role="alert">{error.message}</p>

	if (!data?.suggestion) return <p>Suggestion not found.</p>

	const comments = data.suggestion.comments.nodes

	return (
		<div className={styles.list}>
			{error && <p role="alert">{error.message}</p>}

			{comments.length === 0 && <p>No comments yet.</p>}

			{comments.map((comment) => (
				<article key={comment.id} className={`${styles.card} ${styles.commentCard}`}>
					<header className={styles.commentMeta}>
						<strong>{comment.author.name}</strong>
						<time dateTime={comment.createdAt}>
							{new Date(comment.createdAt).toLocaleString()}
						</time>
					</header>
					
					<p className={styles.commentBody}>{comment.body}</p>
				</article>
			))}

			{data.suggestion.comments.pageInfo.hasNextPage && (
				<button type="button" disabled={loading || loadingMore} onClick={handleLoadMore}>
					{loadingMore ? 'Loading...' : 'Load more comments'}
				</button>
			)}

			{loadMoreError && <p role="alert">{loadMoreError}</p>}
		</div>
	)
}

export default function Comments({ suggestionId }: Props) {
	return (
		<section className={styles.discussion} aria-label="Discussion">
			<h2>Discussion</h2>

			<CreateCommentForm suggestionId={suggestionId} />

			<CommentsContent suggestionId={suggestionId} />
		</section>
	)
}

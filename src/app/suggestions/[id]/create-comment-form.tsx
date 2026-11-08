'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client/react'

import { CreateCommentDocument, GetCommentsDocument } from '@/graphql/generated'
import { authClient } from '@/lib/auth-client'

import styles from '../../page.module.css'

type Props = {
	suggestionId: string
}

export default function CreateCommentForm({ suggestionId }: Props) {
	const [body, setBody] = useState('')
	const [sent, setSent] = useState(false)

	const { data: session, isPending } = authClient.useSession()

	const [createComment, { loading, error }] = useMutation(CreateCommentDocument, {
		update(cache, { data }) {
			const newComment = data?.createComment
			if (!newComment) return

			cache.updateQuery(
				{
					query: GetCommentsDocument,
					variables: {
						id: newComment.suggestionId,
						first: 2,
						after: null,
					},
				},
				(previous) => {
					const suggestion = previous?.suggestion
					if (!suggestion) return previous

					const connection = suggestion.comments
					if (connection.pageInfo.hasNextPage) return previous

					if (connection.nodes.some((comment) => comment.id === newComment.id)) return previous

					return {
						...previous,
						suggestion: {
							...suggestion,
							comments: {
								...connection,
								nodes: [...connection.nodes, newComment],
								pageInfo: {...connection.pageInfo, endCursor: newComment.id},
							},
						},
					}
				},
			)
		},
	})

	async function handleSubmit(event: React.SubmitEvent) {
		event.preventDefault()

		if (!session || loading || !body.trim()) return

		setSent(false)

		try {
			await createComment({
				variables: {
					input: {
						suggestionId,
						body,
					},
				},
			})
		} catch {
			return
		}

		setBody('')
		setSent(true)
	}

	if (isPending) return null

	if (!session) return <p>Sign in to comment.</p>

	const isEmptyBody = !body.trim()

	return (
		<div className={`${styles.card} ${styles.commentForm}`}>
			<form onSubmit={handleSubmit}>
				<label>
					Your comment
					<textarea
						name="body"
						rows={4}
						placeholder='Share your thoughts...'
						value={body}
						disabled={loading}
						onChange={(event) => {
							setBody(event.target.value)
							setSent(false)
						}}
					/>
				</label>
				<button type="submit" disabled={loading || isEmptyBody}>
					{loading ? 'Sending...' : 'Post comment'}
				</button>
			</form>

			{error && <p role="alert">{error.message}</p>}
			{sent && <p role="status">Comment added.</p>}
		</div>
	)
}

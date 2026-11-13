'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GetSuggestionDocument, SetVoteDocument } from '@/graphql/generated'
import { authClient } from '@/lib/auth-client'

export default function SuggestionDemo() {

	const [id, setId] = useState('1')

	const { data, loading, error, refetch } = useQuery(GetSuggestionDocument, {
		variables: { id },
		ssr: false,
	})

	const { data: session, isPending: sessionPending } = authClient.useSession()

	const [setVote, { loading: voting, error: voteError }] = useMutation(SetVoteDocument)

	async function handleVote() {
		const suggestion = data?.suggestion

		if (!suggestion || !session || voting) return

		const voted = !suggestion.viewerHasVoted

		try {
			await setVote({
				variables: { suggestionId: suggestion.id, voted },
				optimisticResponse: {
					setVote: {
						__typename: 'Suggestion',
						id: suggestion.id,
						title: suggestion.title,
						status: suggestion.status,
						voteCount: Math.max(0, suggestion.voteCount + (voted ? 1 : -1)),
						viewerHasVoted: voted,
					},
				},
			})
		} catch {
			// Apollo keeps the error in voteError, so we don't need to do anything
		}
	}

	return (
		<section>
			<button type="button" disabled={loading || voting || id === '1'} onClick={() => setId('1')}>
				Suggestion 1
			</button>

			<button type="button" disabled={loading || voting || id === '2'} onClick={() => setId('2')}>
				Suggestion 2
			</button>

			<button type="button" disabled={loading || voting} onClick={() => refetch().catch(console.error)}>Refresh</button>

			{loading && <p>Loading...</p>}

			{error && <p role="alert">{error.message}</p>}

			{!loading && !error && data?.suggestion && (
				<div>
					<h2>{data.suggestion.title}</h2>
					<p>Votes: {data.suggestion.voteCount}</p>

					{!sessionPending && (
						session ? (
							<button type="button" disabled={voting} onClick={handleVote}>
								{voting 
									? 'Saving...' 
									: data.suggestion.viewerHasVoted 
										? 'Remove vote' 
										: 'Vote'
								}
							</button>
						) : (
							<p>Sign in to vote</p>
						) 
					)}
				</div>
			)}

			{!loading && !error && data?.suggestion === null && <p>No suggestion found</p>}
			{voteError && <p role="alert">{voteError.message}</p>}
		</section>
	)
}

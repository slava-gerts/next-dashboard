'use client'

import { useMutation } from '@apollo/client/react'

import { SetVoteDocument, type GetSuggestionsQuery } from '@/graphql/generated'
import { authClient } from '@/lib/auth-client'

type SuggestionNode = GetSuggestionsQuery['suggestions']['nodes'][number]

const statusLabels: Record<SuggestionNode['status'], string> = {
	OPEN: 'Open',
	PLANNED: 'Planned',
	IN_PROGRESS: 'In progress',
	DONE: 'Done',
	DECLINED: 'Declined',
}

type Props = {
	suggestion: SuggestionNode
}

export default function SuggestionCard({suggestion}: Props) {
	const { data: session, isPending: sessionPending } = authClient.useSession()

	const [setVote, { loading: voting, error: voteError }] = useMutation(SetVoteDocument)

	async function handleVote() {
		if (!session || voting) return

		const voted = !suggestion.viewerHasVoted

		try {
			await setVote({
				variables: {
					suggestionId: suggestion.id,
					voted,
				},
				optimisticResponse: {
					setVote: {
						...suggestion,
						voteCount: Math.max(0, suggestion.voteCount + (voted ? 1 : -1)),
						viewerHasVoted: voted,
					},
				},
			})
		} catch {
			// Apollo exposes the error through voteError
      // and rolls back the optimistic update.
		}
	}

	return (
		<section>
			<h2>{suggestion.title}</h2>

			<p>Status: {statusLabels[suggestion.status]}</p>

			<p>Votes: {suggestion.voteCount}</p>

			{!sessionPending && (
				session ? (
					<button type="button" disabled={voting} onClick={handleVote}>
						{voting 
							? 'Saving...' 
							: suggestion.viewerHasVoted 
								? 'Remove vote' 
								: 'Vote'
						}
					</button>
				) : (
					<p>Sign in to vote</p>
				)
			)}

			{voteError && <p role="alert">{voteError.message}</p>}
		</section>
	)
}

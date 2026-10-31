'use client'

import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client/react'

import { CreateSuggestionDocument, GetSuggestionsDocument } from '@/graphql/generated'
import { authClient } from '@/lib/auth-client'

import styles from './page.module.css'

export default function CreateSuggestionForm() {
	const [suggestion, setSuggestion] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [refreshingError, setRefreshingError] = useState<string | null>(null)

	const apolloClient = useApolloClient()
	const { data: session } = authClient.useSession()

	const [createSuggestion, { loading, error }] = useMutation(CreateSuggestionDocument)

	async function handleCreateSuggestion(event: React.SubmitEvent) {
		event.preventDefault()

		if (!session || loading || refreshing) return

		setRefreshingError(null)

		try {
			await createSuggestion({
				variables: {
					input: { title: suggestion }
				}
			})
		}
		catch {
			// Apollo exposes the mutation error through error.
			return
		}

		setSuggestion('')
		setRefreshing(true)
	
		try {
			await apolloClient.refetchQueries({
				include: [GetSuggestionsDocument]
			})
		} catch {
			setRefreshingError('Suggestion created, but the list could not be refreshed. Reload the page to see it.')
		} finally {
			setRefreshing(false)
		}
	}

	if (!session) return null

	return (
		<div className={`${styles.card} ${styles.createSuggestion}`}>
			<form onSubmit={handleCreateSuggestion}>
				<label>
					Suggestion title
					<input
						placeholder="Suggestion"
						value={suggestion}
						disabled={loading || refreshing}
						onChange={(e) => setSuggestion(e.target.value)}
						name="suggestion"
					/>
				</label>
				<button disabled={loading || refreshing} type="submit">
					{loading ? 
					  'Creating...' : 
						refreshing ? 
						  'Refreshing...' : 
							'Create suggestion'
					}
				</button>
			</form>

			{error && <p role="alert">{error.message}</p>}
			{refreshingError && <p role="alert">{refreshingError}</p>}
		</div>
	)
}

'use client'

import { useActionState, useEffect } from 'react'
import { useApolloClient } from '@apollo/client/react'

import { SuggestionStatus } from '@/generated/prisma/enums'
import { saveSuggestionStatus } from './actions'

import styles from '../page.module.css'

export default function StatusForm({ suggestionId, status }: { suggestionId: string, status: SuggestionStatus }) {
	const { cache } = useApolloClient()
	const [result, formAction, isPending] = useActionState(saveSuggestionStatus, null)

	const error = result?.ok === false ? result.error : null

	useEffect(() => {
		if (!result?.ok) return

		const { id, status } = result.suggestion
		const cacheId = cache.identify({ __typename: 'Suggestion', id })
		if (!cacheId) return

		cache.modify({
			id: cacheId,
			fields: {
				status: () => status
			}
		})
	}, [cache, result])

	return (
		<form action={formAction} className={styles.statusForm}>
			<input type="hidden" name="suggestionId" value={suggestionId} />

			<label>
				Change status
				<select key={status} name="status" defaultValue={status} disabled={isPending}>
					{Object.values(SuggestionStatus).map((option) => (
						<option key={option} value={option}>{option}</option>
					))}
				</select>
			</label>

			<button type="submit" disabled={isPending}>
				{isPending ? 'Saving...' : 'Save'}
			</button>

			{error && <p role="alert">{error}</p>}
		</form>
	)
}

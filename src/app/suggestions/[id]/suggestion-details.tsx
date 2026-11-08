'use client'

import { useQuery } from '@apollo/client/react'

import { GetSuggestionDocument } from '@/graphql/generated'

import SuggestionCard from '../../suggestion-card'
import Comments from './comments'

import styles from '../../page.module.css'

type Props = {
	id: string
}

export default function SuggestionDetails({ id }: Props) {
	const { data, loading, error } = useQuery(GetSuggestionDocument, {
		variables: { id },
		ssr: false,
	})

	if (loading && !data) {
		return <p role="status">Loading suggestion...</p>
	}

	if (error) {
		return <p role="alert">{error.message}</p>
	}

	const suggestion = data?.suggestion

	if (!suggestion) {
		return <p>Suggestion not found.</p>
	}

	return (
		<>
			<article className={styles.card}>
				<SuggestionCard suggestion={suggestion} />
			</article>

			<Comments suggestionId={suggestion.id} />
		</>
	)
}

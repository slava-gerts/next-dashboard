import { Suspense } from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'

import { auth } from '@/server/auth'
import { AccessError } from '@/server/authorization'
import { getModerationSuggestions } from '@/server/moderation/service'

import StatusForm from './status-form'

import styles from '../page.module.css'

export default function ModerationPage() {
	return (
		<main className={styles.page}>
			<header className={styles.header}>
				<div className={styles.intro}>
					<h1>Moderation</h1>
				</div>
				<Link href="/">Back to suggestions</Link>
			</header>

			<Suspense fallback={<p role="status">Loading moderation...</p>}>
				<ModerationSuggestions />
			</Suspense>
		</main>
	)
}

async function ModerationSuggestions() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	try {
		const suggestions = await getModerationSuggestions(session?.user ?? null)

		if (suggestions.length === 0) {
			return <p>No suggestions yet.</p>
		}

		return (
			<ul className={styles.list}>
				{suggestions.map((suggestion) => (
					<li key={suggestion.id} className={styles.card}>
						<h2>{suggestion.title}</h2>
						<p>Status: {suggestion.status}</p>

						<StatusForm suggestionId={suggestion.id} status={suggestion.status} />
					</li>
				))}
			</ul>
		)
	} catch (error) {
		if (error instanceof AccessError) {
			return <p>{error.message}</p>
		}

		throw error
	}
}

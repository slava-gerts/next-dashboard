import Link from 'next/link'

import SuggestionDetails from './suggestion-details'
import styles from '../../page.module.css'

type Props = {
	params: Promise<{ id: string }>
}

export default async function SuggestionPage({ params }: Props) {
	const { id } = await params

	return (
		<main className={styles.page}>
			<Link href="/">← All suggestions</Link>

			<h1>Suggestion</h1>
			<SuggestionDetails id={id} />
		</main>
	)
}

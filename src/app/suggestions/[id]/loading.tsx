import styles from '../../page.module.css'

export default function Loading() {
	return (
		<main className={styles.page}>
			<p role="status">Loading suggestion...</p>
		</main>
	)
}

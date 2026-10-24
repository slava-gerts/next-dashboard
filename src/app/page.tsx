import AuthDemo from './auth-demo'
import SuggestionDemo from './suggestion-demo'

import styles from './page.module.css'

export default function Home() {
	return (
		<main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>PRODUCT FEEDBACK</p>
          <h1>Suggestions</h1>
          <p>Help us decide what to build next.</p>
        </div>

        <div className={styles.account}>
          <AuthDemo />
        </div>
      </header>

      <div className={styles.card}>
        <SuggestionDemo />
      </div>
		</main>
	)
}

'use client'

import { useState } from 'react'
import { useApolloClient } from '@apollo/client/react'

import { authClient } from '@/lib/auth-client'

export default function AuthDemo() {
	const { data: session, isPending, error: sessionError } = authClient.useSession()
	const apolloClient = useApolloClient()

	const [isSigningIn, setIsSigningIn] = useState(false)
	const [isSigningOut, setIsSigningOut] = useState(false)

	const [actionError, setActionError] = useState<string | null>(null)

	async function handleSignIn() {
		setIsSigningIn(true)
		setActionError(null)

		try {
			const { error } = await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/',
			})

			if (error) {
				setActionError(error.message || 'Could not start sign-in')
				setIsSigningIn(false)
			}
		} catch {
			setActionError('Could not connect to the server')
			setIsSigningIn(false)
		}
	}

	async function handleSignOut() {
		setIsSigningOut(true)
		setActionError(null)

		try {
			const { error } = await authClient.signOut()

			if (error) {
				setActionError(error.message || 'Could not sign out')
				return
			}

			try {
				await apolloClient.resetStore()
			} catch {
				setActionError('You are signed out, but suggestions could not be refreshed')
			}
		} catch {
			setActionError('Could not confirm sign-out. Please try again')
		} finally {
			setIsSigningOut(false)
		}
	}

	if (isPending) return <p>Checking session...</p>

	if (sessionError) return <p role="alert">{sessionError.message}</p>

	if (session) {
		return (
			<section>
				<p>Signed in as {session.user.name}</p>

				<button type="button" disabled={isSigningOut} onClick={handleSignOut}>
					{isSigningOut ? 'Signing out...' : 'Sign out'}
				</button>

				{actionError && <p role="alert">{actionError}</p>}
			</section>
		)
	}

	return (
		<section>
			<p>Not signed in</p>

			<button type="button" disabled={isSigningIn || isSigningOut} onClick={handleSignIn}>
				{isSigningIn ? 'Redirecting...' : 'Sign in with Google'}
			</button>

			{actionError && <p role="alert">{actionError}</p>}
		</section>
	)
}

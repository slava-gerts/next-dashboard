'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { SuggestionStatus } from '@/generated/prisma/enums'
import { auth } from '@/server/auth'
import { AccessError } from '@/server/authorization'
import { updateSuggestionStatus } from '@/server/moderation/service'

type SaveStatusResult =
	| { ok: false; error: string }
	| { ok: true; suggestion: { id: string; status: SuggestionStatus }}

export async function saveSuggestionStatus(
	_previousResult: SaveStatusResult | null,
	formData: FormData,
): Promise<SaveStatusResult> {
	const suggestionId = formData.get('suggestionId')
	const submittedStatus = formData.get('status')
	const status = Object.values(SuggestionStatus).find(
		(value) => value === submittedStatus,
	)

	if (typeof suggestionId !== 'string' || !suggestionId.trim() || !status) {
		return {ok: false, error: 'Invalid suggestion or status.'}
	}

	const session = await auth.api.getSession({ headers: await headers() })

	try {
		const updated = await updateSuggestionStatus(
			session?.user ?? null,
			suggestionId,
			status,
		)

		if (!updated) return {ok: false, error: 'Suggestion not found.'}
	} catch (error) {
		if (error instanceof AccessError) return {ok: false, error: error.message}
		throw error
	}

	revalidatePath('/moderation')
	return {ok: true, suggestion: {id: suggestionId, status}}
}

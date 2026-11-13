import 'server-only'

import type { SuggestionStatus } from '@/generated/prisma/enums'
import { requireModerator, ModerationViewer } from '@/server/authorization'
import { prisma } from '@/server/db'

export async function getModerationSuggestions(viewer: ModerationViewer) {
	await requireModerator(viewer)

	return prisma.suggestion.findMany({
		orderBy: [
			{ createdAt: 'desc' },
			{ id: 'desc' },
		],
		take: 50,
		select: {
			id: true,
			title: true,
			status: true,
		},
	})
}

export async function updateSuggestionStatus(viewer: ModerationViewer, suggestionId: string, status: SuggestionStatus) {
	await requireModerator(viewer)

	const { count } = await prisma.suggestion.updateMany({
		where: { id: suggestionId },
		data: { status },
	})

	return count === 1
}

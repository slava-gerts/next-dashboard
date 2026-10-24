import 'server-only'

import { prisma } from '@/server/db'

export async function getSuggestionById(id: string, viewerId: string | null) {
	const suggestion = await prisma.suggestion.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			_count: {
				select: {
					votes: true,
				},
			},
		},
	})

	if (!suggestion) {
		return null
	}
		
	const viewerVote = viewerId === null 
		? null 
		: await prisma.vote.findUnique({
			where: {
				suggestionId_userId: {
					suggestionId: id,
					userId: viewerId,
				},
			},
			select: {
				userId: true,
			},
		})

	return {
		id: suggestion.id,
		title: suggestion.title,
		voteCount: suggestion._count.votes,
		viewerHasVoted: viewerVote !== null,
	}
}

export async function setSuggestionVote(
	suggestionId: string,
	userId: string,
	voted: boolean,
) {
	const suggestion = await prisma.suggestion.findUnique({
		where: { id: suggestionId },
		select: { id: true },
	})

	if (!suggestion) {
		return null
	}

	if (voted) {
		await prisma.vote.createMany({
			data: [{ suggestionId, userId}],
			skipDuplicates: true,
		})
	} else {
		await prisma.vote.deleteMany({
			where: { suggestionId, userId }
		})
	}

	return getSuggestionById(suggestionId, userId)
}

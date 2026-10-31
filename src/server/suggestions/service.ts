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
			data: [{ suggestionId, userId }],
			skipDuplicates: true,
		})
	} else {
		await prisma.vote.deleteMany({
			where: { suggestionId, userId }
		})
	}

	return getSuggestionById(suggestionId, userId)
}

export async function getSuggestionsPage(first: number, after: string | null, viewerId: string | null) {
	const rows = await prisma.suggestion.findMany({
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: first + 1,
		...(after === null ? {} : { cursor: { id: after }, skip: 1 }),
		select: { id: true, title: true, _count: { select: { votes: true } } },
	})

	const hasNextPage = rows.length > first
	const page = rows.slice(0, first)

	const viewerVotes = viewerId === null
		? []
		: await prisma.vote.findMany({
			where: {
				userId: viewerId,
				suggestionId: {
					in: page.map((suggestion) => suggestion.id),
				}
			},
			select: {
				suggestionId: true,
			}
		})

	const votedSuggestionIds = new Set(viewerVotes.map((vote) => vote.suggestionId))

	return {
		nodes: page.map((suggestion) => ({
			id: suggestion.id,
			title: suggestion.title,
			voteCount: suggestion._count.votes,
			viewerHasVoted: votedSuggestionIds.has(suggestion.id),
		})),
		pageInfo: {
			hasNextPage,
			endCursor: page.at(-1)?.id ?? null,
		}
	}
}

type SuggestionErrorCode = 'UNAUTHENTICATED' | 'BAD_USER_INPUT'

export class SuggestionError extends Error {
	constructor(public readonly code: SuggestionErrorCode, message: string) {
		super(message)
		this.name = 'SuggestionError'
	}
}

export async function createSuggestion(rawTitle: string, viewer: { id: string } | null) {
	if (!viewer) {
		throw new SuggestionError('UNAUTHENTICATED', 'Sign in to create a suggestion.')
	}

	const title = rawTitle.trim()
	const titleLength = Array.from(title).length

	if (titleLength < 3 || titleLength > 120) {
		throw new SuggestionError('BAD_USER_INPUT', 'Title must be between 3 and 120 characters long.')
	}

	const suggestion = await prisma.suggestion.create({
		data: { title },
		select: { id: true, title: true },
	})

	return {
		...suggestion,
		voteCount: 0,
		viewerHasVoted: false,
	}
}

import 'server-only'

import { prisma } from '@/server/db'

type CommentErrorCode =
	| 'UNAUTHENTICATED'
	| 'BAD_USER_INPUT'
	| 'NOT_FOUND'

export class CommentError extends Error {
	constructor(public readonly code: CommentErrorCode, message: string) {
		super(message)
		this.name = 'CommentError'
	}
}

export async function createComment(suggestionId: string, rawBody: string, viewer: { id: string } | null) {
	if (!viewer) {
		throw new CommentError('UNAUTHENTICATED', 'Sign in to comment.')
	}

	const body = rawBody.trim()
	const bodyLength = Array.from(body).length

	if (bodyLength < 1 || bodyLength > 2000) {
		throw new CommentError('BAD_USER_INPUT', 'Comment must contain between 1 and 2000 characters.')
	}

	const suggestion = await prisma.suggestion.findUnique({
		where: { id: suggestionId },
		select: { id: true },
	})

	if (!suggestion) {
		throw new CommentError('NOT_FOUND', 'Suggestion not found')
	}

	const comment = await prisma.comment.create({
		data: {
			body,
			suggestionId,
			authorId: viewer.id,
		},
		select: {
			id: true,
			body: true,
			createdAt: true,
			suggestionId: true,
			author: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	return {
		...comment,
		createdAt: comment.createdAt.toISOString(),
	}
}

export async function getCommentsPage(suggestionId: string, first: number, after: string | null) {
	if (!Number.isInteger(first) || first < 1 || first > 50) {
		throw new CommentError('BAD_USER_INPUT', 'first must be an integer between 1 and 50')
	}

	if (after !== null) {
		const cursor = await prisma.comment.findFirst({
			where: {
				id: after,
				suggestionId,
			},
			select: { id: true }
		})

		if (!cursor) {
			throw new CommentError('BAD_USER_INPUT', 'Invalid comment cursor')
		}
	}

	const rows = await prisma.comment.findMany({
		where: { suggestionId },
		orderBy: [
			{ createdAt: 'asc' },
			{ id: 'asc' },
		],
		take: first + 1,
		...(after === null
			? {}
			: { cursor: { id: after }, skip: 1 }
		),
		select: {
			id: true,
			body: true,
			createdAt: true,
			suggestionId: true,
			author: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	const page = rows.slice(0, first)

	return {
		nodes: page.map((comment) => ({
			...comment,
			createdAt: comment.createdAt.toISOString(),
		})),
		pageInfo: {
			hasNextPage: rows.length > first,
			endCursor: page.at(-1)?.id ?? null,
		},
	}
}

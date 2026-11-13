import 'server-only'

import { UserRole } from '@/generated/prisma/enums'

type AccessErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN'

export class AccessError extends Error {
	constructor(public readonly code: AccessErrorCode, message: string) {
		super(message)
		this.name = 'AccessError'
	}
}

export type ModerationViewer = {
	id: string,
	role: UserRole,
} | null

export async function requireModerator(viewer: ModerationViewer) {
	if (!viewer) {
		throw new AccessError('UNAUTHENTICATED', 'Sign in to continue.')
	}

	if (viewer.role !== 'MODERATOR') {
		throw new AccessError('FORBIDDEN', 'Moderator access required.')
	}
}

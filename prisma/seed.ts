import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
	const suggestion = await prisma.suggestion.upsert({
		where: { id: '1' },
		update: {},
		create: {
			id: '1',
			title: 'Add dark mode',
		},
	})

	console.log(suggestion)
	console.log('Suggestion count:', await prisma.suggestion.count())
}

main()
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

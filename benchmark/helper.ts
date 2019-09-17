import { MongoClient, ObjectID } from 'mongodb'

export const QUANTITIES = {
	airports: 200,
	hobbies: 1000,
	jobs: 100,
	travels: 100,
	users: 100,
}

/**
 * Drop database with native lib
 */
export async function drop(url: string, databaseName: string) {
	const client = await MongoClient.connect(url)
	const db = client.db(databaseName)
	await db.dropDatabase()
	return client.close()
}

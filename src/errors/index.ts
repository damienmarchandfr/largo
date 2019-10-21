import { LegatoEntity } from '../entity'

export class LegatoErrorNotConnected extends Error {
	constructor() {
		super(`Your are not connected to MongoDB server.`)
	}
}

export class LegatoErrorCannotDisconnect extends Error {
	constructor() {
		super(`Cannot disconnect. Not connected to MongoDB server.`)
	}
}

export class LegatoErrorCollectionDoesNotExist extends Error {
	constructor(collectionName: string) {
		super(`Cannot find ${collectionName} collection.`)
	}
}

export class LegatoErrorObjectAlreadyInserted extends Error {
	inserted: LegatoEntity

	constructor(inserted: LegatoEntity) {
		super(`Object already inserted with _id = ${inserted._id}.`)
		this.inserted = inserted
	}
}

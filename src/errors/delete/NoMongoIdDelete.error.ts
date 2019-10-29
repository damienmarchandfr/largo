import { LegatoEntity } from '../../entity'

export class LegatoErrorDeleteNoMongoID extends Error {
	toDelete: any

	constructor(toDelete: LegatoEntity) {
		super(`Cannot delete ${toDelete.getCollectionName()}. No mongoID set.`)
		this.toDelete = toDelete.toPlainObj()
	}
}

import { LegatoEntity } from '../../entity'
import { LegatoErrorAbstract, errorCodes } from '..'

export class LegatoErrorDeleteNoMongoID extends LegatoErrorAbstract {
	toDelete: any

	constructor(toDelete: LegatoEntity) {
		const message = `Cannot delete ${toDelete.getCollectionName()}. No MongoID set.`
		super(message, errorCodes.deleteNoMongoID)
		this.toDelete = toDelete.toPlainObj()
	}
}

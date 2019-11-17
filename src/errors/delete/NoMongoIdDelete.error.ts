import { LegatoEntity } from '../../entity'
import { LegatoErrorAbstract } from '..'

export class LegatoErrorDeleteNoMongoID extends LegatoErrorAbstract {
	toDelete: any

	constructor(toDelete: LegatoEntity) {
		const message = `Cannot delete ${toDelete.getCollectionName()}. No mongoID set.`
		super(message, 'LEGATO_ERROR_5')
		this.toDelete = toDelete.toPlainObj()
	}
}

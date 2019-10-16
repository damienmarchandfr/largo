import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorRelationOneToOneCreate extends LegatoError {
	constructor(source: LegatoEntity, sourceKey: string) {
		super('RELATION_ONE_TO_ONE_CREATE')
		this.message = errorMessages.RELATION_ONE_TO_ONE_CREATE({
			source,
			sourceKey,
		})
	}
}

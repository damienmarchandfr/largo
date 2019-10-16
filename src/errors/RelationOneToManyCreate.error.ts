import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorRelationOneToManyCreate extends LegatoError {
	constructor(source: LegatoEntity, sourceKey: string, sourceKeyValue: any) {
		super('RELATION_ONE_TO_MANY_CREATE')
		this.message = errorMessages.RELATION_ONE_TO_MANY_CREATE({
			source,
			sourceKey,
			sourceKeyValue,
		})
	}
}

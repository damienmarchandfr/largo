import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorRelationOneToManyUpdate extends LegatoError {
	constructor(source: LegatoEntity, sourceKey: string, sourceKeyValue: any) {
		super('RELATION_ONE_TO_MANY_UPDATE')
		this.message = errorMessages.RELATION_ONE_TO_MANY_UPDATE({
			source,
			sourceKey,
			sourceKeyValue,
		})
	}
}

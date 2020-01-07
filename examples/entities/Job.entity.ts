import { LegatoEntity } from '../../src/entity'
import { LegatoField } from '../../src/decorators/field.decorator'
import { ObjectID } from 'mongodb'
export class Job extends LegatoEntity {
	@LegatoField()
	name: string = new ObjectID().toHexString()

	@LegatoField()
	startDate: Date = new Date()

	@LegatoField()
	endDate: Date = new Date()
}

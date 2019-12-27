import { LegatoEntity } from '../../entity'
import { LegatoField } from '../../decorators/field.decorator'
import { LegatoIndex } from '../../decorators/index.decorator'
import { ObjectID } from 'mongodb'

export class ConnectionTestModel extends LegatoEntity {
	@LegatoField()
	property: string = ''

	@LegatoIndex({
		unique: true,
	})
	id: string = new ObjectID().toHexString()
}

export class ConnectionTestModel2 extends LegatoEntity {
	@LegatoField()
	property: string = ''
}

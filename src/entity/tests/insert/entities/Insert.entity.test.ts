import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class InsertTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

export class InsertTest extends LegatoEntity {
	@LegatoField()
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

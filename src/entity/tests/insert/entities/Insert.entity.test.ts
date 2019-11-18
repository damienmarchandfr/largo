import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class InsertTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor() {
		super()
		this.name = 'john'
	}
}

export class InsertTest extends LegatoEntity {
	@LegatoField()
	name: string

	constructor() {
		super()
		this.name = 'john'
	}
}

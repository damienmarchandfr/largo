import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class FindEntityTest extends LegatoEntity {
	@LegatoField()
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

export class FindEntityTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor(name = 'john') {
		super()
		this.name = name
	}
}

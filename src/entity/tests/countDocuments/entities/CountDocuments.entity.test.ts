import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class CountDocumentsTest extends LegatoEntity {
	@LegatoField()
	name: string

	constructor(name: string) {
		super()
		this.name = name
	}
}

export class CountDocumentsTestWithoutDecorator extends LegatoEntity {
	name: string

	constructor(name: string) {
		super()
		this.name = name
	}
}

import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'

export class GetCopyTest extends LegatoEntity {
	public name: string

	constructor() {
		super()
		this.name = 'John'
	}
}

export class GetCopyEmptyTest extends LegatoEntity {
	public sayHello() {
		return 'Hello John Doe !'
	}
}

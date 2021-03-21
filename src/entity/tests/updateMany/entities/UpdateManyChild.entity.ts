import { LegatoEntity } from '../../..'
import { LegatoField } from '../../../../decorators/field.decorator'
import { LegatoIndex } from '../../../../decorators/index.decorator'

export class UpdateManyChildTest extends LegatoEntity {
	@LegatoField()
	name: string

	// Custom ids
	@LegatoIndex({
		unique: false,
	})
	stringId: string | null = null

	@LegatoIndex({
		unique: false,
	})
	numberId: number | null = null

	constructor(name = 'john') {
		super()
		this.name = name
	}
}
